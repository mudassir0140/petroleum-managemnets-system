import { cache } from "react";
import { cookies } from "next/headers";
import { ObjectId, type Document, type WithId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import { SUPPLIER_ACCOUNTS } from "./service";

export const SUPPLIER_COOKIE_NAME = "supplier_session";
const PUMP_OWNER_COOKIE_NAME = "pump_owner_session";

function objectIdOrNull(value: unknown): ObjectId | null {
  const text = String(value ?? "").trim();
  return /^[a-f0-9]{24}$/i.test(text) ? new ObjectId(text) : null;
}

// The signed-in supplier, found by the random token stored on their account.
export const getSupplierAccount = cache(async (): Promise<WithId<Document> | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SUPPLIER_COOKIE_NAME)?.value;
  if (!token) return null;

  const db = await getDatabase();
  return db.collection(SUPPLIER_ACCOUNTS).findOne({ sessionToken: token, role: "supplier" });
});

// The signed-in pump owner's pump, for API routes. Returns null instead of redirecting,
// and only when the pump still exists, is online and is active.
export async function getOwnerPumpIdForApi(): Promise<ObjectId | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(PUMP_OWNER_COOKIE_NAME)?.value;
  if (!raw) return null;

  let pumpId: ObjectId | null = null;
  try {
    pumpId = objectIdOrNull(JSON.parse(raw)?.pumpId);
  } catch {
    return null;
  }
  if (!pumpId) return null;

  const db = await getDatabase();
  const pump = await db.collection("pumps").findOne({ _id: pumpId }, { projection: { status: 1, accountStatus: 1 } });
  if (!pump || pump.status !== "Online" || pump.accountStatus === "inactive") return null;
  return pumpId;
}
