import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AdminSession } from "@/lib/admin/types";

const ADMIN_COOKIE_NAME = "admin_session";

export const getAdminSession = cache(async (): Promise<AdminSession> => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    redirect("/admin/login");
  }

  try {
    const session = JSON.parse(sessionCookie) as AdminSession;
    return session;
  } catch {
    redirect("/admin/login");
  }
});

export async function requireAdminAuth(): Promise<AdminSession> {
  return getAdminSession();
}
