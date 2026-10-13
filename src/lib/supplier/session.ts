import { cache } from "react";
import { cookies } from "next/headers";
import { getDatabase } from "@/lib/db/mongodb";
import { getSession } from "@/lib/session";
import { SUPPLIER_COLLECTIONS } from "./service";

export const SUPPLIER_COOKIE_NAME = "supplier_session";
const PUMP_OWNER_COOKIE_NAME = "pump_owner_session";

// The supplier cookie holds a random token. The token is stored on the supplier
// account, so a cookie can't be forged from a known account id.
export const getSupplierAccount = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SUPPLIER_COOKIE_NAME)?.value;
  if (!token) return null;

  const db = await getDatabase();
  return db.collection(SUPPLIER_COLLECTIONS.accounts).findOne({ sessionToken: token });
});

// Pump Admin session for API routes. Returns null instead of redirecting when signed out.
export async function getPumpAdminSessionOrNull() {
  const cookieStore = await cookies();
  if (!cookieStore.get(PUMP_OWNER_COOKIE_NAME)?.value) return null;
  return getSession();
}
