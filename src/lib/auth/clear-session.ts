import { cookies } from "next/headers";

// Where every logout lands. The flag tells the login page to clear the browser's storage too.
export const LOGOUT_REDIRECT = "/auth/login?logout=1";

// Expires every cookie this request carries. Each role's login is a cookie, so
// clearing them all means no role can be signed back in after Logout.
export async function clearAllSessionCookies(): Promise<void> {
  const cookieStore = await cookies();
  for (const cookie of cookieStore.getAll()) {
    cookieStore.set(cookie.name, "", { path: "/", maxAge: 0 });
  }
}
