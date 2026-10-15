"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { markLogout } from "@/lib/db/attendance-service";
import { clearAllAuthCookies } from "@/lib/auth/logout";
import { endEmployeeSession } from "./session-store";

// Full logout for employees (Exit to website on the attendant dashboard).
export async function employeeLogout(): Promise<void> {
  const cookieStore = await cookies();
  let session = null;
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
  redirect("/");
}
