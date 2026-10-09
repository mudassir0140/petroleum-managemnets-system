import { NextRequest, NextResponse } from "next/server";
import { employeeLogin } from "@/lib/db/employee-service";
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
    const body = await request.json();
    const { email, username, password } = body;

    if (!password || (!email && !username)) {
      return NextResponse.json(
        { error: "Username/email and password required" },
        { status: 400 }
      );
    }

    let employee: any = null;
    let isPumpEmployee = false;

    // Try to login as pump employee first (if using username)
    if (username) {
      const db = await getDatabase();
      const pumpEmpCollection = db.collection("pump_employees");
      const pumpEmployee = await pumpEmpCollection.findOne({ username });

      if (pumpEmployee && verifyPassword(password, pumpEmployee.passwordHash)) {
        employee = pumpEmployee;
        isPumpEmployee = true;
      }
    }

    // Fall back to regular employee login
    if (!employee) {
      employee = await employeeLogin(email || username, password);
    }

    if (!employee) {
      return NextResponse.json(
        { error: "Invalid credentials or account inactive" },
        { status: 401 }
      );
    }

    const employeeId = employee._id!.toString();
    const pumpId = employee.pumpId?.toString();

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
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
