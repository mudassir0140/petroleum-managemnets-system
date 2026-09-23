import { NextRequest, NextResponse } from "next/server";
import { employeeLogin } from "@/lib/db/employee-service";
import { markLogin, getTodayAttendance } from "@/lib/db/attendance-service";
import { getReadingsByAttendance } from "@/lib/db/meter-reading-service";
import { getRoleBySlug } from "@/lib/roles";
import { cookies } from "next/headers";

// Pump attendants operate a fuel nozzle/meter, so their shift needs a start
// reading + photo before they can do anything else. Other roles just get
// attendance marked and go straight to their dashboard.
const METER_READING_ROLES = new Set(["pump-attendant"]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    const employee = await employeeLogin(email, password);
    if (!employee) {
      return NextResponse.json(
        { error: "Invalid email, password, or account inactive" },
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
      email: employee.email,
      name: employee.name,
      role: employee.role,
      pumpId: employee.pumpId,
      attendanceId: attendance?._id,
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

    // Pump attendants always go through the real (MongoDB-backed) shift
    // flow, never the role's configured dashboardHref — that page is the
    // pre-existing demo/simulation dashboard and has nothing to do with
    // this employee's real session. Attendant with no pump assigned can't
    // log a meter reading at all, so falls through to the normal dashboard
    // instead of being stuck on a gate it can never satisfy.
    if (METER_READING_ROLES.has(employee.role) && attendance?._id && pumpId) {
      const readings = await getReadingsByAttendance(attendance._id.toString());
      const hasStartReading = readings.some((r) => r.type === "start");
      needsStartReading = !hasStartReading;
      redirectUrl = hasStartReading ? "/dashboard/attendant/shift" : "/dashboard/attendant/shift/start";
    }

    return NextResponse.json({
      success: true,
      redirectUrl,
      needsStartReading,
      employee: {
        _id: employee._id,
        email: employee.email,
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
