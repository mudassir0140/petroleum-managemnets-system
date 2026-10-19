import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { getTruckAccount } from "@/lib/truck/session";
import { getSupplierAccount } from "@/lib/supplier/session";
import { encryptSecret } from "@/lib/supplier/secret";
import { newPasswordError } from "@/lib/account/password-rules";

// Change Password works for these sign-in types. The account is always found from the
// session cookie for that role, never from a user id sent by the browser.
export const ACCOUNT_ROLES = ["truck", "supplier", "attendant", "pump-owner"] as const;
export type AccountRole = (typeof ACCOUNT_ROLES)[number];

export function isAccountRole(value: unknown): value is AccountRole {
  return typeof value === "string" && (ACCOUNT_ROLES as readonly string[]).includes(value);
}

export type AccountResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

interface AccountRef {
  collection: string;
  id: ObjectId;
}

// Attendant sign-in stores the employee id and whether it is a pump employee in the employee_session cookie.
async function attendantRef(): Promise<AccountRef | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("employee_session")?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.role !== "pump-attendant") return null;
    const id = String(parsed.userId ?? "");
    if (!/^[a-f0-9]{24}$/i.test(id)) return null;
    return { collection: parsed.isPumpEmployee ? "pump_employees" : "employees", id: new ObjectId(id) };
  } catch {
    return null;
  }
}

// The pump owner's login is the pump record (ownerPasswordHash). Read straight from the cookie,
// without the dashboard session helper, which redirects instead of returning null.
async function pumpOwnerRef(): Promise<AccountRef | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("pump_owner_session")?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const id = String(parsed?.pumpId ?? "");
    if (!/^[a-f0-9]{24}$/i.test(id)) return null;
    return { collection: "pumps", id: new ObjectId(id) };
  } catch {
    return null;
  }
}

// The account signed in under this role, or null when that role has no active session.
export async function findAccountForRole(role: AccountRole): Promise<AccountRef | null> {
  if (role === "truck") {
    const account = await getTruckAccount();
    return account ? { collection: "trucks", id: account._id as ObjectId } : null;
  }
  if (role === "supplier") {
    const account = await getSupplierAccount();
    return account ? { collection: "supplierAccounts", id: account._id as ObjectId } : null;
  }
  if (role === "pump-owner") return pumpOwnerRef();
  return attendantRef();
}

// The field that holds each role's password hash.
function hashField(role: AccountRole): string {
  return role === "pump-owner" ? "ownerPasswordHash" : "passwordHash";
}

// Checks the current password against the stored hash, then stores the new one.
// Supplier accounts also keep a reversible copy (passwordEnc) that the pump owner can show, so it is updated too.
export async function changeOwnPassword(
  role: AccountRole,
  currentPassword: string,
  newPassword: string
): Promise<AccountResult<{ changed: true }>> {
  const ruleError = newPasswordError(role, newPassword);
  if (ruleError) return { ok: false, status: 400, error: ruleError };
  if (newPassword === currentPassword) {
    return { ok: false, status: 400, error: "Choose a password that is different from the current one" };
  }

  const ref = await findAccountForRole(role);
  if (!ref) return { ok: false, status: 401, error: "Please sign in again" };

  const db = await getDatabase();
  const accounts = db.collection(ref.collection);
  const field = hashField(role);
  const account = await accounts.findOne({ _id: ref.id }, { projection: { [field]: 1 } });
  if (!account) return { ok: false, status: 401, error: "Please sign in again" };
  const storedHash = account[field];
  if (typeof storedHash !== "string" || !verifyPassword(currentPassword, storedHash)) {
    return { ok: false, status: 401, error: "The current password is wrong" };
  }

  const update: Record<string, unknown> = {
    [field]: hashPassword(newPassword),
    passwordChangedAt: new Date(),
    updatedAt: new Date(),
  };
  if (role === "supplier") update.passwordEnc = encryptSecret(newPassword);

  await accounts.updateOne({ _id: ref.id }, { $set: update });
  return { ok: true, data: { changed: true } };
}
