import { NextRequest, NextResponse } from "next/server";
import { getEmployeeSession } from "@/lib/employee/session";
import { markLogout } from "@/lib/db/attendance-service";
import { clearAllSessionCookies, LOGOUT_REDIRECT } from "@/lib/auth/clear-session";

// A Route Handler, not a Server Component page — cookie mutation
// (clearing the session) is only allowed in a Server Action or Route
// Handler in this Next.js version, not during a component's render.
export async function GET(request: NextRequest) {
  const session = await getEmployeeSession();
  if (session?.attendanceId) {
    await markLogout(session.attendanceId);
  }

  await clearAllSessionCookies();

  return NextResponse.redirect(new URL(LOGOUT_REDIRECT, request.url));
}
