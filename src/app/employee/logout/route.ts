import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { markLogout } from "@/lib/db/attendance-service";
import { performLogout } from "@/lib/auth/logout";

// Logout link for employee dashboards: the shared logout, then the login page.
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  let session: Record<string, unknown> | null = null;
  try {
    session = JSON.parse(cookieStore.get("employee_session")?.value ?? "null");
  } catch {
    session = null;
  }
  if (session?.attendanceId) {
    await markLogout(String(session.attendanceId)).catch(() => undefined);
  }
  await performLogout();
  return NextResponse.redirect(new URL("/auth/login", request.url));
}
