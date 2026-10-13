import { NextRequest, NextResponse } from "next/server";
import { markLogin, getTodayAttendance } from "@/lib/db/attendance-service";
import { getReadingsByAttendance } from "@/lib/db/meter-reading-service";
import { getRoleBySlug } from "@/lib/roles";
import { getDatabase } from "@/lib/db/mongodb";
import { verifyPassword } from "@/lib/auth/password";
import { cookies } from "next/headers";

// Pump attendants operate a fuel nozzle/meter, so their shift needs a start
// reading + photo before they can do anything else. Other roles just get
// attendance marked and go straight to their dashboard.
const METER_READING_ROLES = new Set(["pump-attendant"]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const username = typeof body?.username === "string" ? body.username.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    const fail = (status: number, error: string) => NextResponse.json({ error }, { status });

    if (!password || (!email && !username)) {
      return fail(400, "Username/email and password required");
    }

    const db = await getDatabase();
    let employee: any = null;
    let isPumpEmployee = false;

    // Try to login as pump employee first (if using username)
    if (username) {
      const pumpEmployee = await db.collection("pump_employees").findOne({ username });
      if (pumpEmployee) {
        if (!pumpEmployee.passwordHash || !verifyPassword(password, pumpEmployee.passwordHash)) {
          return fail(401, "Wrong password");
        }
        employee = pumpEmployee;
        isPumpEmployee = true;
      }
    }

    // Fall back to regular employee login: by email when one was typed, otherwise by username
    if (!employee) {
      const record = await db.collection("employees").findOne(
        email ? { email } : { $or: [{ username }, { email: username }] }
      );
      if (!record) return fail(401, "Account not found");
      if (record.status !== "active") return fail(401, "Account is inactive");
      if (!record.passwordHash || !verifyPassword(password, record.passwordHash)) {
        return fail(401, "Wrong password");
      }
      await db.collection("employees").updateOne({ _id: record._id }, { $set: { lastLogin: new Date() } });
      employee = record;
    }

    if (!employee._id) return fail(401, "Account not found");

    const employeeId = String(employee._id);
    const pumpId = employee.pumpId ? String(employee.pumpId) : undefined;

    console.log("[EmployeeLogin] Employee authenticated:", {
      name: employee.name,
      role: employee.role,
      isPumpEmployee,
      pumpId
    });

    // Auto-mark attendance for today (idempotent — a second login the same
    // day just returns the existing record instead of creating another).
    const attendance = await markLogin(employeeId, pumpId);

    // Set secure session cookie
    const cookieStore = await cookies();
    cookieStore.set("employee_session", JSON.stringify({
      userId: employee._id,
      email: employee.email || employee.username,
      name: employee.name,
      role: employee.role,
      pumpId: employee.pumpId,
      attendanceId: attendance?._id,
      isPumpEmployee,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });


    // Detect the employee's role and point the client at that role's
    // dashboard — same lookup the demo user-login flow uses (see
    // src/lib/user/actions.ts userLogin), so every role lands on the
    // dashboard it was configured for in ROLES (src/lib/roles.ts).
    let redirectUrl: string = getRoleBySlug(employee.role).dashboardHref;
    let needsStartReading = false;

    // Pump attendants go to the attendance page which has integrated shift management
    if (METER_READING_ROLES.has(employee.role) && pumpId) {
      redirectUrl = "/dashboard/attendant/attendance";
    }


    return NextResponse.json({
      success: true,
      redirectUrl,
      needsStartReading,
      employee: {
        _id: employee._id,
        email: employee.email || employee.username,
        name: employee.name,
        role: employee.role,
        pumpId: employee.pumpId,
      },
    });
  } catch (error) {
    console.error("[login]", error);
    return NextResponse.json({ error: "Server/database error" }, { status: 500 });
  }
}
