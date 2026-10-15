"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { markLogout } from "@/lib/db/attendance-service";
import { performLogout } from "@/lib/auth/logout";

// Logout for every employee dashboard (the Logout button in the shell).
export async function employeeLogout(): Promise<void> {
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
  redirect("/auth/login");
}
