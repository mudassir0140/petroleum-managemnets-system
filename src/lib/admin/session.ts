import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AdminSession } from "@/lib/admin/types";
import { isAdminSessionValid } from "@/lib/db/admin-service";

const ADMIN_COOKIE_NAME = "admin_session";

// The cookie alone is not enough: its session token must still match the admin's
// server session. After Logout (or a new login elsewhere) the old cookie is refused.
export const getAdminSession = cache(async (): Promise<AdminSession> => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  let session: AdminSession | null = null;
  try {
    session = sessionCookie ? (JSON.parse(sessionCookie) as AdminSession) : null;
  } catch {
    session = null;
  }

  const valid =
    !!session &&
    (await isAdminSessionValid(String(session.adminId ?? ""), String((session as { sessionToken?: string }).sessionToken ?? "")));
  if (!session || !valid) {
    redirect("/developer");
  }
  return session;
});

export async function requireAdminAuth(): Promise<AdminSession> {
  return getAdminSession();
}
