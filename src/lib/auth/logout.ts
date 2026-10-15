import { cookies } from "next/headers";

// Every login cookie this app sets. Logout clears all of them, so no role stays signed in.
export const AUTH_COOKIES = [
  "admin_session",
  "employee_session",
  "pump_owner_session",
  "khata_client_session",
  "supplier_session",
  "truck_session",
  "pp_demo_role",
  "user_session",
];

export async function clearAllAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  for (const name of AUTH_COOKIES) {
    cookieStore.set(name, "", { path: "/", maxAge: 0 });
  }
}
