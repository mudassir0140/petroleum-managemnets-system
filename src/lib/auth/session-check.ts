import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import { getRoleBySlug, isRoleSlug } from "@/lib/roles";
import { isAdminSessionValid as adminTokenMatches } from "@/lib/db/admin-service";
import { isEmployeeSessionValid } from "@/lib/employee/session-store";

// Every session cookie is checked against MongoDB before a page treats the
// visitor as signed in. A cookie with an id that no longer exists is a
// signed-out visitor, so it can't bounce between a login page and a dashboard.

export const ADMIN_SESSION_COOKIE = "admin_session";
export const PUMP_OWNER_SESSION_COOKIE = "pump_owner_session";
export const EMPLOYEE_SESSION_COOKIE = "employee_session";
export const KHATA_CLIENT_SESSION_COOKIE = "khata_client_session";

function parseCookieJson(raw: string | undefined): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function toObjectIdOrNull(value: unknown): ObjectId | null {
  const text = String(value ?? "").trim();
  return /^[a-f0-9]{24}$/i.test(text) ? new ObjectId(text) : null;
}

export async function isAdminSessionValid(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = parseCookieJson(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  const adminId = toObjectIdOrNull(session?.adminId);
  if (!adminId) return false;
  return adminTokenMatches(adminId.toHexString(), String(session?.sessionToken ?? ""));
}

async function pumpOwnerIsValid(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = parseCookieJson(cookieStore.get(PUMP_OWNER_SESSION_COOKIE)?.value);
  const pumpId = toObjectIdOrNull(session?.pumpId);
  if (!pumpId) return false;

  const db = await getDatabase();
  const pump = await db.collection("pumps").findOne({ _id: pumpId }, { projection: { status: 1, accountStatus: 1 } });
  return !!pump && pump.status === "Online" && pump.accountStatus !== "inactive";
}

// The employee cookie's role and pump are checked against the employee's own record.
export async function findEmployeeSession(): Promise<{ role: string; pumpId: string | null } | null> {
  const cookieStore = await cookies();
  const session = parseCookieJson(cookieStore.get(EMPLOYEE_SESSION_COOKIE)?.value);
  const role = typeof session?.role === "string" ? session.role : "";
  const userId = toObjectIdOrNull(session?.userId);
  if (!userId || !isRoleSlug(role)) return null;
  const token = String(session?.sessionToken ?? "");

  // Pump staff are stored in pump_employees, company staff in employees (see employee-login).
  // The cookie's token must match the server session stored on that record.
  for (const collection of ["pump_employees", "employees"]) {
    const isPumpEmployee = collection === "pump_employees";
    if (await isEmployeeSessionValid(userId.toHexString(), token, isPumpEmployee)) {
      return { role, pumpId: session?.pumpId ? String(session.pumpId) : null };
    }
  }
  return null;
}

async function khataClientIsValid(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = parseCookieJson(cookieStore.get(KHATA_CLIENT_SESSION_COOKIE)?.value);
  const khataClientId = toObjectIdOrNull(session?.khataClientId);
  if (!khataClientId) return false;

  const db = await getDatabase();
  const client = await db.collection("khataClients").findOne({ _id: khataClientId }, { projection: { _id: 1 } });
  return !!client;
}

// A supplier's session token must match the one stored on their account.
async function supplierIsValid(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("supplier_session")?.value;
  if (!token) return false;

  const db = await getDatabase();
  const account = await db.collection("supplierAccounts").findOne({ sessionToken: token, role: "supplier" }, { projection: { _id: 1 } });
  return !!account;
}

// A driver's session token must match the one stored on their truck.
async function truckIsValid(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("truck_session")?.value;
  if (!token) return false;

  const db = await getDatabase();
  const truck = await db.collection("trucks").findOne({ sessionToken: token }, { projection: { _id: 1 } });
  return !!truck;
}

// Where a verified signed-in visitor belongs, or null when signed out.
export async function findSignedInDestination(): Promise<string | null> {
  try {
    if (await isAdminSessionValid()) return "/admin";
    if (await pumpOwnerIsValid()) return "/pumpadmin";

    const employee = await findEmployeeSession();
    if (employee) {
      if (employee.role === "pump-attendant" && employee.pumpId) return "/dashboard/attendant/attendance";
      return getRoleBySlug(employee.role as Parameters<typeof getRoleBySlug>[0]).dashboardHref;
    }

    if (await khataClientIsValid()) return "/khata-client/dashboard";
    if (await supplierIsValid()) return "/supplier";
    if (await truckIsValid()) return "/truck";
    return null;
  } catch (error) {
    // If the database can't be reached, show the login form rather than an error page.
    console.error("[SessionCheck] could not verify session:", error);
    return null;
  }
}
