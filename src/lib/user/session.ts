import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserSession } from "@/lib/user/types";

const USER_COOKIE_NAME = "user_session";

export const getUserSession = cache(async (): Promise<UserSession | null> => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(USER_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const session = JSON.parse(sessionCookie) as UserSession;
    return session;
  } catch {
    return null;
  }
});

export async function requireUserAuth(): Promise<UserSession> {
  const session = await getUserSession();
  if (!session) {
    redirect("/auth/login");
  }
  return session;
}
