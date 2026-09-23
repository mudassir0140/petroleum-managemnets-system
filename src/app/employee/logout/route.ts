import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getEmployeeSession } from "@/lib/employee/session";
import { markLogout } from "@/lib/db/attendance-service";

const EMPLOYEE_SESSION_COOKIE_NAME = "employee_session";

// A Route Handler, not a Server Component page — cookie mutation
// (clearing the session) is only allowed in a Server Action or Route
// Handler in this Next.js version, not during a component's render.
export async function GET(request: NextRequest) {
  const session = await getEmployeeSession();
  if (session?.attendanceId) {
    await markLogout(session.attendanceId);
  }

  const cookieStore = await cookies();
  cookieStore.delete(EMPLOYEE_SESSION_COOKIE_NAME);

  return NextResponse.redirect(new URL("/auth/login", request.url));
}
