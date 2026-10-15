import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import { SUPPLIER_ACCOUNTS, SUPPLIER_REQUESTS } from "./service";
import { SUPPLIER_FUEL_LABELS, type SupplierFuelType, type SupplierRequestStatus } from "./types";

// Supplier fuel-request notifications, stored in the existing "notifications" collection.
//   fuel-request       -> recipient: the supplier   (a pump owner sent a request)
//   supplier-response  -> recipient: the pump owner (the supplier confirmed or rejected)
// Every notification carries the request, supplier and pump it belongs to, and reads
// and marks are always limited to the signed-in recipient.
export const NOTIFICATIONS = "notifications";

export interface SupplierNotificationView {
  id: string;
  type: "fuel-request" | "supplier-response";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  requestId: string;
  supplierId: string;
  pumpId: string;
  pumpName: string;
  fuelType: SupplierFuelType | "";
  litres: number;
  // The request's status right now, so an opened notification shows the current state.
  requestStatus: SupplierRequestStatus | "";
  // Where clicking the notification goes: the exact request, highlighted on that page.
  href: string;
}

function num(value: unknown): number {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? ""));
  return Number.isFinite(n) ? n : 0;
}

// Inserts a notification once per dedupeKey. A repeated event matches the existing
// document, so nothing is inserted twice.
async function insertOnce(dedupeKey: string, doc: Record<string, unknown>): Promise<void> {
  const db = await getDatabase();
  const now = new Date();
  await db.collection(NOTIFICATIONS).updateOne(
    { dedupeKey },
    { $setOnInsert: { ...doc, read: false, createdAt: now, updatedAt: now } },
    { upsert: true }
  );
}

// Called when a pump owner submits a request to a supplier.
export async function notifySupplierOfRequest(request: {
  _id: ObjectId;
  supplierId: ObjectId;
  pumpId: ObjectId;
  pumpName: string;
  fuelType: string;
  litres: number;
}): Promise<void> {
  const fuel = SUPPLIER_FUEL_LABELS[request.fuelType as SupplierFuelType]?.en ?? request.fuelType;
  await insertOnce(`fuel-request:${request._id}`, {
    recipientId: request.supplierId,
    recipientType: "supplier",
    type: "fuel-request",
    requestId: request._id,
    supplierId: request.supplierId,
    pumpId: request.pumpId,
    title: "New fuel request / نئی ایندھن درخواست",
    message: `${request.pumpName || "A pump"} requested ${num(request.litres).toLocaleString()} L of ${fuel}`,
    data: { pumpName: request.pumpName, fuelType: request.fuelType, quantityLitres: num(request.litres) },
  });
}

// Called after the supplier confirms (accept) or rejects a request.
export async function notifyOwnerOfResponse(request: {
  _id: ObjectId;
  supplierId: ObjectId;
  pumpId: ObjectId;
  pumpName: string;
  fuelType: string;
  litres: number;
  status: SupplierRequestStatus;
}): Promise<void> {
  if (request.status !== "accepted" && request.status !== "rejected") return;
  const db = await getDatabase();
  const supplier = await db
    .collection(SUPPLIER_ACCOUNTS)
    .findOne({ _id: request.supplierId }, { projection: { name: 1, companyName: 1 } });
  const supplierName = String(supplier?.companyName || supplier?.name || "The supplier");
  const confirmed = request.status === "accepted";
  await insertOnce(`supplier-response:${request._id}:${request.status}`, {
    recipientId: request.pumpId,
    recipientType: "pump-owner",
    type: "supplier-response",
    requestId: request._id,
    supplierId: request.supplierId,
    pumpId: request.pumpId,
    title: confirmed ? "Supplier confirmed / سپلائر نے تصدیق کی" : "Supplier rejected / سپلائر نے مسترد کیا",
    message: `${supplierName} ${confirmed ? "confirmed" : "rejected"} your request for ${num(request.litres).toLocaleString()} L of ${SUPPLIER_FUEL_LABELS[request.fuelType as SupplierFuelType]?.en ?? request.fuelType}`,
    data: { pumpName: request.pumpName, fuelType: request.fuelType, quantityLitres: num(request.litres) },
  });
}

async function toViews(
  docs: Array<Record<string, unknown>>,
  hrefFor: (requestId: string, supplierId: string) => string
): Promise<SupplierNotificationView[]> {
  if (docs.length === 0) return [];
  const db = await getDatabase();
  const requestIds = docs.map((d) => d.requestId as ObjectId).filter(Boolean);
  const requests = await db
    .collection(SUPPLIER_REQUESTS)
    .find({ _id: { $in: requestIds } }, { projection: { status: 1, litres: 1, fuelType: 1, pumpName: 1 } })
    .toArray();
  const byId = new Map(requests.map((r) => [String(r._id), r]));

  return docs.map((d) => {
    const requestId = String(d.requestId ?? "");
    const supplierId = String(d.supplierId ?? "");
    const request = byId.get(requestId);
    const data = (d.data ?? {}) as Record<string, unknown>;
    return {
      id: String(d._id),
      type: d.type as SupplierNotificationView["type"],
      title: String(d.title ?? ""),
      message: String(d.message ?? ""),
      read: d.read === true,
      createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : "",
      requestId,
      supplierId,
      pumpId: String(d.pumpId ?? ""),
      pumpName: String(request?.pumpName || data.pumpName || ""),
      fuelType: (request?.fuelType || data.fuelType || "") as SupplierFuelType | "",
      litres: num(request?.litres ?? data.quantityLitres),
      requestStatus: (request?.status as SupplierRequestStatus) ?? "",
      href: hrefFor(requestId, supplierId),
    };
  });
}

// The supplier's notifications, newest first, with the unread count.
export async function listSupplierNotifications(supplierId: ObjectId, limit = 30) {
  const db = await getDatabase();
  const filter = { recipientType: "supplier", recipientId: supplierId, type: "fuel-request" };
  const [docs, unread] = await Promise.all([
    db.collection(NOTIFICATIONS).find(filter).sort({ createdAt: -1 }).limit(limit).toArray(),
    db.collection(NOTIFICATIONS).countDocuments({ ...filter, read: false }),
  ]);
  return {
    unread,
    items: await toViews(docs, (requestId) => `/supplier?request=${requestId}`),
  };
}

// The pump owner's notifications about supplier responses, newest first, with the unread count.
export async function listOwnerNotifications(pumpId: ObjectId, limit = 30) {
  const db = await getDatabase();
  const filter = { recipientType: "pump-owner", recipientId: pumpId, type: "supplier-response" };
  const [docs, unread] = await Promise.all([
    db.collection(NOTIFICATIONS).find(filter).sort({ createdAt: -1 }).limit(limit).toArray(),
    db.collection(NOTIFICATIONS).countDocuments({ ...filter, read: false }),
  ]);
  return {
    unread,
    items: await toViews(docs, (requestId, supplierId) => `/pumpadmin/fuel-orders/${supplierId}?request=${requestId}`),
  };
}

// Marks one notification read, only if it belongs to the signed-in recipient.
export async function markNotificationRead(
  recipientType: "supplier" | "pump-owner",
  recipientId: ObjectId,
  notificationId: ObjectId
): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.collection(NOTIFICATIONS).updateOne(
    { _id: notificationId, recipientType, recipientId },
    { $set: { read: true, updatedAt: new Date() } }
  );
  return result.matchedCount === 1;
}

