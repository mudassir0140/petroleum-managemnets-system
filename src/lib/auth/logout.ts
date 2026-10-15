import { cookies } from "next/headers";
import { endAdminSession } from "@/lib/db/admin-service";
import { endEmployeeSession } from "@/lib/employee/session-store";

// Every login cookie this app sets. Logout clears all of them, so no role stays signed in.
const AUTH_COOKIES = [
  "admin_session",
  "employee_session",
  "pump_owner_session",
  "khata_client_session",
  "supplier_session",
  "truck_session",
  "pp_demo_role",
  "user_session",
];

function parseCookieJson(raw: string | undefined): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

// The one logout for every role (use it from server actions and route handlers).
// 1. Ends the server session that exists for the role (admin and employee tokens).
// 2. Deletes every auth cookie, so no old cookie can sign anyone back in.
// The caller then redirects to the login page for its role.
export async function performLogout(): Promise<void> {
  const cookieStore = await cookies();

  const admin = parseCookieJson(cookieStore.get("admin_session")?.value);
  if (admin?.adminId) {
    await endAdminSession(String(admin.adminId)).catch((error) => console.error("[Logout] admin session:", error));
  }

  const employee = parseCookieJson(cookieStore.get("employee_session")?.value);
  if (employee?.userId) {
    await endEmployeeSession(String(employee.userId), Boolean(employee.isPumpEmployee)).catch((error) =>
      console.error("[Logout] employee session:", error)
    );
  }

  for (const name of AUTH_COOKIES) {
    cookieStore.set(name, "", { path: "/", maxAge: 0 });
  }
}
