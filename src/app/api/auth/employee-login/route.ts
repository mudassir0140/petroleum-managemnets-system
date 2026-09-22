import { NextRequest, NextResponse } from "next/server";
import { employeeLogin } from "@/lib/db/employee-service";
import { getRoleBySlug } from "@/lib/roles";
import { cookies } from "next/headers";

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

    // Set secure session cookie
    const cookieStore = await cookies();
    cookieStore.set("employee_session", JSON.stringify({
      userId: employee._id,
      email: employee.email,
      name: employee.name,
      role: employee.role,
      pumpId: employee.pumpId,
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
    const redirectUrl = getRoleBySlug(employee.role).dashboardHref;

    return NextResponse.json({
      success: true,
      redirectUrl,
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
