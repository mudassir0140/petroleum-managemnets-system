import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { markLogout } from "@/lib/db/attendance-service";
import { clearAllAuthCookies } from "@/lib/auth/logout";
import { endEmployeeSession } from "@/lib/employee/session-store";

// Full logout: ends the employee's server session, marks the attendance logout,
// clears every auth cookie, then sends the visitor to the website.
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  let session: Record<string, unknown> | null = null;
  try {
    session = JSON.parse(cookieStore.get("employee_session")?.value ?? "null");
  } catch {
    session = null;
  }
  if (session?.userId) {
    await endEmployeeSession(String(session.userId), Boolean(session.isPumpEmployee)).catch(() => undefined);
  }
  if (session?.attendanceId) {
    await markLogout(String(session.attendanceId)).catch(() => undefined);
  }
  await clearAllAuthCookies();
  return NextResponse.redirect(new URL("/", request.url));
}
