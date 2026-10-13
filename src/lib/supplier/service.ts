import crypto from "crypto";
import { ObjectId, type Db, type Document, type WithId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  EMPTY_SUPPLIER_SUMMARY,
  SUPPLIER_FUEL_LABELS,
  type SupplierDelivery,
  type SupplierFuelType,
  type SupplierListItem,
  type SupplierNotification,
  type SupplierPayment,
  type SupplierProfile,
  type SupplierRequest,
  type SupplierSummary,
} from "./types";

// Collection names. Suppliers belong to the pump that created them (pumpId).
export const SUPPLIER_COLLECTIONS = {
  accounts: "supplierAccounts",
  requests: "supplierFuelRequests",
  deliveries: "supplierDeliveries",
  payments: "supplierPayments",
  notifications: "supplierNotifications",
} as const;

export type ServiceResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

const money = (n: number) => Math.round(n * 100) / 100;
const num = (value: unknown) => {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? ""));
  return Number.isFinite(n) ? n : 0;
};
const iso = (value: unknown) => (value instanceof Date ? value.toISOString() : typeof value === "string" ? value : "");
const shortDate = (value: Date) => value.toISOString().slice(0, 10);

export function generatePassword(): string {
  return crypto.randomBytes(9).toString("base64url").slice(0, 12);
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Username format: <owner first name>@<company name>, e.g. mudassir@fahadpetrol.
// Adds a number when the name is already taken.
export async function buildSupplierUsername(ownerName: string, companyName: string): Promise<string> {
  const db = await getDatabase();
  const ownerPart = slug(ownerName.trim().split(/\s+/)[0] ?? "") || "owner";
  const companyPart = slug(companyName) || "company";
  const base = `${ownerPart}@${companyPart}`;

  let candidate = base;
  let counter = 2;
  while (await db.collection(SUPPLIER_COLLECTIONS.accounts).findOne({ username: candidate }, { projection: { _id: 1 } })) {
    candidate = `${base}${counter}`;
    counter++;
  }
  return candidate;
}

function toProfile(account: WithId<Document>): SupplierProfile {
  return {
    _id: String(account._id),
    ownerName: account.ownerName ?? "",
    companyName: account.companyName ?? "",
    username: account.username ?? "",
    fuelType: account.fuelType,
    location: account.location ?? "",
    contact: account.contact ?? "",
    pumpId: String(account.pumpId),
    createdAt: iso(account.createdAt),
  };
}

function toRequest(doc: WithId<Document>): SupplierRequest {
  return {
    _id: String(doc._id),
    supplierId: String(doc.supplierId),
    pumpName: doc.pumpName ?? "",
    fuelType: doc.fuelType,
    litres: num(doc.litres),
    deliveredLitres: num(doc.deliveredLitres),
    note: doc.note ?? "",
    status: doc.status,
    requestedAt: iso(doc.requestedAt),
    respondedAt: doc.respondedAt ? iso(doc.respondedAt) : undefined,
  };
}

function toDelivery(doc: WithId<Document>): SupplierDelivery {
  return {
    _id: String(doc._id),
    requestId: String(doc.requestId),
    fuelType: doc.fuelType,
    litres: num(doc.litres),
    ratePerLitre: num(doc.ratePerLitre),
    amount: num(doc.amount),
    deliveredAt: iso(doc.deliveredAt),
    note: doc.note ?? "",
  };
}

function toPayment(doc: WithId<Document>): SupplierPayment {
  return {
    _id: String(doc._id),
    amount: num(doc.amount),
    paidAt: iso(doc.paidAt),
    note: doc.note ?? "",
  };
}

function toNotification(doc: WithId<Document>): SupplierNotification {
  return {
    _id: String(doc._id),
    type: doc.type ?? "",
    title: doc.title ?? "",
    message: doc.message ?? "",
    pumpName: doc.pumpName ?? "",
    fuelType: doc.fuelType,
    litres: num(doc.litres),
    requestDate: iso(doc.requestDate),
    createdAt: iso(doc.createdAt),
    readAt: doc.readAt ? iso(doc.readAt) : undefined,
  };
}

// Totals per supplier. With a pumpId, only that pump's requests, deliveries and payments count.
async function loadSummaries(db: Db, supplierIds: ObjectId[], pumpId?: ObjectId): Promise<Map<string, SupplierSummary>> {
  const filter: Record<string, unknown> = { supplierId: { $in: supplierIds } };
  if (pumpId) filter.pumpId = pumpId;
  const [requests, deliveries, payments] = await Promise.all([
    db.collection(SUPPLIER_COLLECTIONS.requests).find(filter).toArray(),
    db.collection(SUPPLIER_COLLECTIONS.deliveries).find(filter).toArray(),
    db.collection(SUPPLIER_COLLECTIONS.payments).find(filter).toArray(),
  ]);

  const map = new Map<string, SupplierSummary>();
  const get = (id: unknown) => {
    const key = String(id);
    if (!map.has(key)) map.set(key, { ...EMPTY_SUPPLIER_SUMMARY });
    return map.get(key)!;
  };

  for (const r of requests) {
    const s = get(r.supplierId);
    if (r.status !== "rejected") s.requestedLitres += num(r.litres);
    if (r.status === "pending") s.pendingRequests++;
  }
  for (const d of deliveries) {
    const s = get(d.supplierId);
    s.deliveredLitres += num(d.litres);
    s.deliveredAmount += num(d.amount);
  }
  for (const p of payments) {
    get(p.supplierId).receivedAmount += num(p.amount);
  }
  for (const s of map.values()) {
    s.requestedLitres = money(s.requestedLitres);
    s.deliveredLitres = money(s.deliveredLitres);
    s.deliveredAmount = money(s.deliveredAmount);
    s.receivedAmount = money(s.receivedAmount);
    s.pendingAmount = money(Math.max(0, s.deliveredAmount - s.receivedAmount));
  }
  return map;
}

// Every supplier company in the system. Summary figures are for the given pump.
export async function listSuppliersForPump(pumpId: ObjectId): Promise<SupplierListItem[]> {
  const db = await getDatabase();
  const accounts = await db
    .collection(SUPPLIER_COLLECTIONS.accounts)
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
  const summaries = await loadSummaries(db, accounts.map((a) => a._id), pumpId);
  return accounts.map((a) => ({
    ...toProfile(a),
    summary: summaries.get(String(a._id)) ?? { ...EMPTY_SUPPLIER_SUMMARY },
  }));
}

export async function createSupplierAccount(
  pumpId: ObjectId,
  input: { ownerName: string; companyName: string; fuelType: SupplierFuelType; location: string; contact: string; password: string }
): Promise<SupplierProfile> {
  const db = await getDatabase();
  const accounts = db.collection(SUPPLIER_COLLECTIONS.accounts);
  await accounts.createIndex({ username: 1 }, { unique: true });

  const username = await buildSupplierUsername(input.ownerName, input.companyName);
  const now = new Date();
  const doc = {
    pumpId,
    ownerName: input.ownerName,
    companyName: input.companyName,
    username,
    passwordHash: hashPassword(input.password),
    fuelType: input.fuelType,
    location: input.location,
    contact: input.contact,
    sessionToken: null,
    createdAt: now,
    updatedAt: now,
  };
  const result = await accounts.insertOne(doc);
  return toProfile({ ...doc, _id: result.insertedId });
}

export async function getSupplierDetail(pumpId: ObjectId, supplierId: ObjectId) {
  const db = await getDatabase();
  const account = await db.collection(SUPPLIER_COLLECTIONS.accounts).findOne({ _id: supplierId });
  if (!account) return null;

  // Only this pump's requests, deliveries and payments are shown to the pump.
  const filter = { supplierId, pumpId };
  const [requests, deliveries, payments, notifications, summaries] = await Promise.all([
    db.collection(SUPPLIER_COLLECTIONS.requests).find(filter).sort({ requestedAt: -1 }).toArray(),
    db.collection(SUPPLIER_COLLECTIONS.deliveries).find(filter).sort({ deliveredAt: -1 }).toArray(),
    db.collection(SUPPLIER_COLLECTIONS.payments).find(filter).sort({ paidAt: -1 }).toArray(),
    db
      .collection(SUPPLIER_COLLECTIONS.notifications)
      .find({ recipient: "pump", recipientId: pumpId, supplierId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray(),
    loadSummaries(db, [supplierId], pumpId),
  ]);

  return {
    supplier: toProfile(account),
    summary: summaries.get(String(supplierId)) ?? { ...EMPTY_SUPPLIER_SUMMARY },
    requests: requests.map(toRequest),
    deliveries: deliveries.map(toDelivery),
    payments: payments.map(toPayment),
    notifications: notifications.map(toNotification),
  };
}

// Sets a new password. Leaving it blank generates one; the caller shows it once.
export async function resetSupplierPassword(
  supplierId: ObjectId,
  requestedPassword?: string
): Promise<{ username: string; password: string } | null> {
  const db = await getDatabase();
  const password = requestedPassword?.trim() ? requestedPassword.trim() : generatePassword();
  const result = await db.collection(SUPPLIER_COLLECTIONS.accounts).findOneAndUpdate(
    { _id: supplierId },
    { $set: { passwordHash: hashPassword(password), sessionToken: null, updatedAt: new Date() } },
    { returnDocument: "after", projection: { username: 1 } }
  );
  if (!result) return null;
  return { username: result.username, password };
}

async function notify(
  db: Db,
  doc: {
    recipient: "supplier" | "pump";
    recipientId: ObjectId;
    supplierId: ObjectId;
    requestId?: ObjectId;
    type: string;
    title: string;
    message: string;
    pumpName: string;
    fuelType: SupplierFuelType;
    litres: number;
    requestDate: Date;
  }
) {
  await db.collection(SUPPLIER_COLLECTIONS.notifications).insertOne({ ...doc, readAt: null, createdAt: new Date() });
}

// Pump Admin sends a request. The selected supplier is notified straight away.
export async function sendSupplierRequest(
  pumpId: ObjectId,
  input: { supplierId: ObjectId; litres: number; note: string }
): Promise<ServiceResult<{ requestId: string }>> {
  const db = await getDatabase();
  const supplier = await db.collection(SUPPLIER_COLLECTIONS.accounts).findOne({ _id: input.supplierId });
  if (!supplier) return { ok: false, status: 404, error: "Supplier not found" };

  const pump = await db.collection("pumps").findOne({ _id: pumpId }, { projection: { name: 1 } });
  const pumpName = pump?.name || "Pump";
  const now = new Date();
  const label = SUPPLIER_FUEL_LABELS[supplier.fuelType as SupplierFuelType];

  const result = await db.collection(SUPPLIER_COLLECTIONS.requests).insertOne({
    supplierId: supplier._id,
    pumpId,
    pumpName,
    fuelType: supplier.fuelType,
    litres: input.litres,
    deliveredLitres: 0,
    note: input.note,
    status: "pending",
    requestedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  await notify(db, {
    recipient: "supplier",
    recipientId: supplier._id,
    supplierId: supplier._id,
    requestId: result.insertedId,
    type: "request",
    title: `New fuel request from ${pumpName}`,
    message: `${pumpName} requested ${input.litres} litres of ${label} on ${shortDate(now)}.`,
    pumpName,
    fuelType: supplier.fuelType,
    litres: input.litres,
    requestDate: now,
  });

  return { ok: true, data: { requestId: String(result.insertedId) } };
}

// Supplier accepts or rejects a pending request; the pump is notified.
export async function respondToSupplierRequest(
  supplier: WithId<Document>,
  requestId: ObjectId,
  action: "accept" | "reject"
): Promise<ServiceResult<{ status: "accepted" | "rejected" }>> {
  const db = await getDatabase();
  const requests = db.collection(SUPPLIER_COLLECTIONS.requests);
  const request = await requests.findOne({ _id: requestId, supplierId: supplier._id });
  if (!request) return { ok: false, status: 404, error: "Request not found" };
  if (request.status !== "pending") {
    return { ok: false, status: 409, error: `This request is already ${request.status}` };
  }

  const status = action === "accept" ? "accepted" : "rejected";
  const now = new Date();
  await requests.updateOne({ _id: requestId }, { $set: { status, respondedAt: now, updatedAt: now } });

  const label = SUPPLIER_FUEL_LABELS[request.fuelType as SupplierFuelType];
  await notify(db, {
    recipient: "pump",
    recipientId: request.pumpId,
    supplierId: supplier._id,
    requestId,
    type: status,
    title: `Request ${status} by ${supplier.companyName}`,
    message: `${supplier.companyName} ${status} your request for ${num(request.litres)} litres of ${label} (requested ${shortDate(request.requestedAt)}).`,
    pumpName: request.pumpName,
    fuelType: request.fuelType,
    litres: num(request.litres),
    requestDate: request.requestedAt,
  });

  return { ok: true, data: { status } };
}

// Records a delivery against an accepted request. Partial deliveries are allowed
// until the requested litres are covered, then the request becomes Delivered.
export async function recordSupplierDelivery(
  supplier: WithId<Document>,
  input: { requestId: ObjectId; litres: number; ratePerLitre: number; deliveredOn?: Date; note: string }
): Promise<ServiceResult<{ deliveryId: string; amount: number; status: string }>> {
  const db = await getDatabase();
  const requests = db.collection(SUPPLIER_COLLECTIONS.requests);
  const request = await requests.findOne({ _id: input.requestId, supplierId: supplier._id });
  if (!request) return { ok: false, status: 404, error: "Request not found" };
  if (request.status === "pending" || request.status === "rejected") {
    return { ok: false, status: 409, error: "Accept the request before recording a delivery" };
  }
  if (request.status === "delivered") {
    return { ok: false, status: 409, error: "This request is already fully delivered" };
  }

  const requested = num(request.litres);
  const alreadyDelivered = num(request.deliveredLitres);
  const remaining = money(requested - alreadyDelivered);
  if (!(input.litres > 0) || input.litres > remaining) {
    return { ok: false, status: 400, error: `Litres must be more than 0 and at most ${remaining}` };
  }
  if (!(input.ratePerLitre > 0)) {
    return { ok: false, status: 400, error: "Rate per litre must be more than 0" };
  }

  const now = new Date();
  const amount = money(input.litres * input.ratePerLitre);
  const deliveredAt = input.deliveredOn ?? now;
  const deliveryResult = await db.collection(SUPPLIER_COLLECTIONS.deliveries).insertOne({
    supplierId: supplier._id,
    pumpId: request.pumpId,
    requestId: request._id,
    fuelType: request.fuelType,
    litres: input.litres,
    ratePerLitre: input.ratePerLitre,
    amount,
    deliveredAt,
    note: input.note,
    createdAt: now,
  });

  const newDelivered = money(alreadyDelivered + input.litres);
  const newStatus = newDelivered >= requested ? "delivered" : "accepted";
  await requests.updateOne(
    { _id: request._id },
    { $set: { deliveredLitres: newDelivered, status: newStatus, updatedAt: now } }
  );

  const label = SUPPLIER_FUEL_LABELS[request.fuelType as SupplierFuelType];
  await notify(db, {
    recipient: "pump",
    recipientId: request.pumpId,
    supplierId: supplier._id,
    requestId: request._id,
    type: "delivered",
    title: `Delivery recorded by ${supplier.companyName}`,
    message: `${input.litres} litres of ${label} delivered at ${input.ratePerLitre} per litre (amount ${amount}). Request status: ${newStatus}.`,
    pumpName: request.pumpName,
    fuelType: request.fuelType,
    litres: input.litres,
    requestDate: request.requestedAt,
  });

  return { ok: true, data: { deliveryId: String(deliveryResult.insertedId), amount, status: newStatus } };
}

// Records a payment the supplier received from one pump. Payments can't go above
// what that pump still owes for this supplier's deliveries.
export async function recordSupplierPayment(
  supplier: WithId<Document>,
  input: { pumpId: ObjectId; amount: number; paidOn?: Date; note: string }
): Promise<ServiceResult<{ paymentId: string; pendingAmount: number }>> {
  if (!(input.amount > 0)) return { ok: false, status: 400, error: "Amount must be more than 0" };

  const db = await getDatabase();
  const owed = await loadSummaries(db, [supplier._id], input.pumpId);
  const pending = owed.get(String(supplier._id))?.pendingAmount ?? 0;
  if (pending <= 0) {
    return { ok: false, status: 409, error: "This pump has no pending amount for your deliveries" };
  }
  if (money(input.amount) > pending) {
    return { ok: false, status: 400, error: `Amount is more than the pending PKR ${pending}` };
  }

  const now = new Date();
  const result = await db.collection(SUPPLIER_COLLECTIONS.payments).insertOne({
    supplierId: supplier._id,
    pumpId: input.pumpId,
    amount: money(input.amount),
    paidAt: input.paidOn ?? now,
    note: input.note,
    createdAt: now,
  });

  await notify(db, {
    recipient: "pump",
    recipientId: input.pumpId,
    supplierId: supplier._id,
    type: "payment",
    title: `Payment received by ${supplier.companyName}`,
    message: `${supplier.companyName} recorded a payment of PKR ${money(input.amount)}.`,
    pumpName: "",
    fuelType: supplier.fuelType,
    litres: 0,
    requestDate: now,
  });

  const newPending = money(Math.max(0, pending - money(input.amount)));
  return { ok: true, data: { paymentId: String(result.insertedId), pendingAmount: newPending } };
}

// Everything the supplier dashboard shows: all requests and records for this supplier,
// with totals broken down by the pump they came from.
export async function getSupplierDashboard(supplier: WithId<Document>) {
  const db = await getDatabase();
  const filter = { supplierId: supplier._id };
  const [requests, deliveries, payments, notifications, summaries] = await Promise.all([
    db.collection(SUPPLIER_COLLECTIONS.requests).find(filter).sort({ requestedAt: -1 }).toArray(),
    db.collection(SUPPLIER_COLLECTIONS.deliveries).find(filter).sort({ deliveredAt: -1 }).toArray(),
    db.collection(SUPPLIER_COLLECTIONS.payments).find(filter).sort({ paidAt: -1 }).toArray(),
    db
      .collection(SUPPLIER_COLLECTIONS.notifications)
      .find({ recipient: "supplier", recipientId: supplier._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray(),
    loadSummaries(db, [supplier._id]),
  ]);

  // One row per pump that has sent this supplier a request.
  const pumpRows = new Map<string, { pumpId: string; pumpName: string; summary: SupplierSummary }>();
  for (const r of requests) {
    const key = String(r.pumpId);
    if (!pumpRows.has(key)) {
      pumpRows.set(key, { pumpId: key, pumpName: r.pumpName ?? "", summary: { ...EMPTY_SUPPLIER_SUMMARY } });
    }
  }
  for (const key of pumpRows.keys()) {
    const perPump = await loadSummaries(db, [supplier._id], new ObjectId(key));
    pumpRows.get(key)!.summary = perPump.get(String(supplier._id)) ?? { ...EMPTY_SUPPLIER_SUMMARY };
  }

  const notificationItems = notifications.map(toNotification);
  return {
    supplier: toProfile(supplier),
    summary: summaries.get(String(supplier._id)) ?? { ...EMPTY_SUPPLIER_SUMMARY },
    pumps: Array.from(pumpRows.values()),
    requests: requests.map(toRequest),
    deliveries: deliveries.map(toDelivery),
    payments: payments.map(toPayment),
    notifications: notificationItems,
    unreadCount: notificationItems.filter((n) => !n.readAt).length,
  };
}

export async function markSupplierNotificationsRead(supplierId: ObjectId): Promise<void> {
  const db = await getDatabase();
  await db
    .collection(SUPPLIER_COLLECTIONS.notifications)
    .updateMany({ recipient: "supplier", recipientId: supplierId, readAt: null }, { $set: { readAt: new Date() } });
}

// Login check for a supplier account. Returns a session token on success.
export async function authenticateSupplier(
  username: string,
  password: string
): Promise<ServiceResult<{ token: string; supplier: WithId<Document> }>> {
  const db = await getDatabase();
  const normalized = username.trim().toLowerCase();
  const accounts = db.collection(SUPPLIER_COLLECTIONS.accounts);
  const account = await accounts.findOne({ username: normalized });
  if (!account || !account.passwordHash) return { ok: false, status: 401, error: "Account not found" };
  if (!verifyPassword(password, account.passwordHash)) return { ok: false, status: 401, error: "Wrong password" };

  const token = crypto.randomBytes(32).toString("hex");
  await accounts.updateOne({ _id: account._id }, { $set: { sessionToken: token, lastLoginAt: new Date() } });
  return { ok: true, data: { token, supplier: account } };
}

export async function endSupplierSession(token: string): Promise<void> {
  const db = await getDatabase();
  await db.collection(SUPPLIER_COLLECTIONS.accounts).updateOne({ sessionToken: token }, { $set: { sessionToken: null } });
}
