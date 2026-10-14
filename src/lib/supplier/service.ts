import crypto from "crypto";
import { ObjectId, type Document, type WithId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { decryptSecret, encryptSecret } from "./secret";
import {
  SUPPLIER_ACTION_RULES,
  type SupplierAction,
  type SupplierFuelType,
  type SupplierRequestStatus,
  type SupplierRequestView,
  type SupplierView,
} from "./types";

// Supplier accounts carry role "supplier" and the pumpId of the pump that created them.
// Every read or write below takes the pumpId or supplierId that the server derived from
// the session, never from client input.
export const SUPPLIER_ACCOUNTS = "supplierAccounts";
export const SUPPLIER_REQUESTS = "supplierRequests";

export type ServiceResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

function iso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : "";
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function num(value: unknown): number {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? ""));
  return Number.isFinite(n) ? n : 0;
}

export function toSupplierView(doc: WithId<Document>): SupplierView {
  return {
    id: String(doc._id),
    name: text(doc.name),
    companyName: text(doc.companyName),
    username: text(doc.username),
    advance: num(doc.advance),
    pumpId: String(doc.pumpId ?? ""),
    createdAt: iso(doc.createdAt),
  };
}

export function toRequestView(doc: WithId<Document>): SupplierRequestView {
  return {
    id: String(doc._id),
    supplierId: String(doc.supplierId ?? ""),
    pumpId: String(doc.pumpId ?? ""),
    pumpName: text(doc.pumpName),
    fuelType: doc.fuelType as SupplierFuelType,
    litres: num(doc.litres),
    note: text(doc.note),
    status: (doc.status as SupplierRequestStatus) ?? "sent",
    sentAt: iso(doc.sentAt),
    seenAt: iso(doc.seenAt),
    respondedAt: iso(doc.respondedAt),
    deliveredAt: iso(doc.deliveredAt),
  };
}

function slugPart(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Username: <first word of the name>@<company>, lowercase, with a number added if taken.
export async function buildSupplierUsername(name: string, companyName: string): Promise<string> {
  const db = await getDatabase();
  const namePart = slugPart(name.trim().split(/\s+/)[0] ?? "") || "supplier";
  const companyPart = slugPart(companyName) || "company";
  const base = `${namePart}@${companyPart}`;

  let candidate = base;
  let counter = 2;
  while (await db.collection(SUPPLIER_ACCOUNTS).findOne({ username: candidate }, { projection: { _id: 1 } })) {
    candidate = `${base}${counter}`;
    counter++;
  }
  return candidate;
}

export async function createSupplier(
  pumpId: ObjectId,
  input: { name: string; companyName: string; advance: number; password: string }
): Promise<ServiceResult<SupplierView>> {
  const db = await getDatabase();
  const accounts = db.collection(SUPPLIER_ACCOUNTS);
  await accounts.createIndex({ username: 1 }, { unique: true });

  const username = await buildSupplierUsername(input.name, input.companyName);
  const now = new Date();
  const doc = {
    role: "supplier",
    pumpId,
    name: input.name,
    companyName: input.companyName,
    username,
    advance: input.advance,
    passwordHash: hashPassword(input.password),
    passwordEnc: encryptSecret(input.password),
    sessionToken: null,
    createdAt: now,
    updatedAt: now,
  };
  const result = await accounts.insertOne(doc);
  return { ok: true, data: toSupplierView({ ...doc, _id: result.insertedId }) };
}

export async function listSuppliersForPump(pumpId: ObjectId): Promise<SupplierView[]> {
  const db = await getDatabase();
  const docs = await db.collection(SUPPLIER_ACCOUNTS).find({ pumpId }).sort({ createdAt: -1 }).toArray();
  return docs.map(toSupplierView);
}

export async function getSupplierForPump(pumpId: ObjectId, supplierId: ObjectId): Promise<SupplierView | null> {
  const db = await getDatabase();
  const doc = await db.collection(SUPPLIER_ACCOUNTS).findOne({ _id: supplierId, pumpId });
  return doc ? toSupplierView(doc) : null;
}

// The supplier's login name and password, for the owner's Show and Copy.
export async function revealSupplierCredentials(
  pumpId: ObjectId,
  supplierId: ObjectId
): Promise<ServiceResult<{ username: string; password: string }>> {
  const db = await getDatabase();
  const doc = await db.collection(SUPPLIER_ACCOUNTS).findOne({ _id: supplierId, pumpId }, { projection: { username: 1, passwordEnc: 1 } });
  if (!doc) return { ok: false, status: 404, error: "Supplier not found" };
  if (typeof doc.passwordEnc !== "string" || doc.passwordEnc === "") {
    return { ok: false, status: 409, error: "No password is stored for this supplier" };
  }
  try {
    return { ok: true, data: { username: text(doc.username), password: decryptSecret(doc.passwordEnc) } };
  } catch {
    // Happens when the encryption key has changed since the password was saved.
    return { ok: false, status: 409, error: "This password can't be shown. Ask the admin to reset it." };
  }
}

export async function createSupplierRequest(
  pumpId: ObjectId,
  input: { supplierId: ObjectId; fuelType: SupplierFuelType; litres: number; note: string }
): Promise<ServiceResult<SupplierRequestView>> {
  const db = await getDatabase();
  const supplier = await db.collection(SUPPLIER_ACCOUNTS).findOne({ _id: input.supplierId, pumpId }, { projection: { _id: 1 } });
  if (!supplier) return { ok: false, status: 404, error: "Supplier not found" };

  const pump = await db.collection("pumps").findOne({ _id: pumpId }, { projection: { name: 1 } });
  const now = new Date();
  const doc = {
    supplierId: input.supplierId,
    pumpId,
    pumpName: pump?.name ?? "",
    fuelType: input.fuelType,
    litres: input.litres,
    note: input.note,
    status: "sent" as SupplierRequestStatus,
    sentAt: now,
    seenAt: null,
    respondedAt: null,
    deliveredAt: null,
    createdAt: now,
    updatedAt: now,
  };
  const result = await db.collection(SUPPLIER_REQUESTS).insertOne(doc);
  return { ok: true, data: toRequestView({ ...doc, _id: result.insertedId }) };
}

// The owner's view: requests this pump sent to one supplier, newest first.
export async function listRequestsForPumpSupplier(pumpId: ObjectId, supplierId: ObjectId): Promise<SupplierRequestView[]> {
  const db = await getDatabase();
  const docs = await db.collection(SUPPLIER_REQUESTS).find({ pumpId, supplierId }).sort({ sentAt: -1 }).toArray();
  return docs.map(toRequestView);
}

// The supplier's view: only their own requests, newest first.
export async function listRequestsForSupplier(supplierId: ObjectId): Promise<SupplierRequestView[]> {
  const db = await getDatabase();
  const docs = await db.collection(SUPPLIER_REQUESTS).find({ supplierId }).sort({ sentAt: -1 }).toArray();
  return docs.map(toRequestView);
}

// Moves a request to its next status. The update only matches when the request is still
// in a status the action allows, so two clicks can't both succeed.
export async function applySupplierAction(
  supplierId: ObjectId,
  requestId: ObjectId,
  action: SupplierAction
): Promise<ServiceResult<SupplierRequestView>> {
  const db = await getDatabase();
  const rule = SUPPLIER_ACTION_RULES[action];
  const requests = db.collection(SUPPLIER_REQUESTS);

  const existing = await requests.findOne({ _id: requestId, supplierId });
  if (!existing) return { ok: false, status: 404, error: "Request not found" };

  const now = new Date();
  const stamp: Record<string, Date> = {};
  if (action === "seen") stamp.seenAt = now;
  if (action === "accept" || action === "reject") stamp.respondedAt = now;
  if (action === "deliver") stamp.deliveredAt = now;

  const updated = await requests.findOneAndUpdate(
    { _id: requestId, supplierId, status: { $in: rule.from } },
    { $set: { status: rule.to, ...stamp, updatedAt: now } },
    { returnDocument: "after" }
  );
  if (!updated) {
    return { ok: false, status: 409, error: `This request is already ${existing.status}` };
  }
  return { ok: true, data: toRequestView(updated) };
}

// Supplier login. Returns a session token on success.
export async function authenticateSupplier(
  username: string,
  password: string
): Promise<ServiceResult<{ token: string; supplier: WithId<Document> }>> {
  const db = await getDatabase();
  const accounts = db.collection(SUPPLIER_ACCOUNTS);
  const account = await accounts.findOne({ username: username.trim().toLowerCase(), role: "supplier" });
  if (!account || typeof account.passwordHash !== "string") return { ok: false, status: 401, error: "Account not found" };
  if (!verifyPassword(password, account.passwordHash)) return { ok: false, status: 401, error: "Wrong password" };

  const token = crypto.randomBytes(32).toString("hex");
  await accounts.updateOne({ _id: account._id }, { $set: { sessionToken: token, lastLoginAt: new Date() } });
  return { ok: true, data: { token, supplier: account } };
}

export async function endSupplierSession(token: string): Promise<void> {
  const db = await getDatabase();
  await db.collection(SUPPLIER_ACCOUNTS).updateOne({ sessionToken: token }, { $set: { sessionToken: null } });
}
