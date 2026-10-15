import { cookies } from "next/headers";
import { markLogout } from "@/lib/db/attendance-service";
import { getEmployeeSession } from "@/lib/employee/session";
import { endSupplierSession } from "@/lib/supplier/service";
import { SUPPLIER_COOKIE_NAME } from "@/lib/supplier/session";
import { endTruckSession } from "@/lib/truck/service";
import { TRUCK_COOKIE_NAME } from "@/lib/truck/session";

// Every cookie that proves a login. Logout expires each one with path "/",
// the same path they were set with.
export const AUTH_COOKIE_NAMES = [
  "admin_session",
  "pump_owner_session",
  "employee_session",
  "khata_client_session",
  SUPPLIER_COOKIE_NAME,
  TRUCK_COOKIE_NAME,
  "user_session",
  "pp_demo_role",
] as const;

export const LOGIN_PAGE = "/auth/login";
export const ADMIN_LOGIN_PAGE = "/developer";

// The one logout for every role. It ends the server-side record behind the
// session (attendance, supplier and driver tokens), expires every auth cookie,
// and returns the page the browser should go to next.
export async function endSession(): Promise<string> {
  const cookieStore = await cookies();
  const isAdmin = !!cookieStore.get("admin_session")?.value;

  const employee = await getEmployeeSession();
  if (employee?.attendanceId) await markLogout(employee.attendanceId);

  const supplierToken = cookieStore.get(SUPPLIER_COOKIE_NAME)?.value;
  if (supplierToken) await endSupplierSession(supplierToken).catch((error) => console.error("[Logout] supplier:", error));

  const truckToken = cookieStore.get(TRUCK_COOKIE_NAME)?.value;
  if (truckToken) await endTruckSession(truckToken).catch((error) => console.error("[Logout] truck:", error));

  for (const name of AUTH_COOKIE_NAMES) {
    cookieStore.delete({ name, path: "/" });
  }

  return isAdmin ? ADMIN_LOGIN_PAGE : `${LOGIN_PAGE}?logout=1`;
}
