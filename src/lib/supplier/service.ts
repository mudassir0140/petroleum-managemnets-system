import crypto from "crypto";
import { ObjectId, type Document, type WithId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { fetchRoute, type RouteResult } from "@/lib/truck/route";
import { decryptSecret, encryptSecret } from "./secret";
import {
  SUPPLIER_ACTION_RULES,
  SUPPLIER_ASSIGN_RULE,
  type SupplierAction,
  type SupplierFuelType,
  type SupplierRequestStatus,
  type SupplierRequestView,
  type SupplierTruckType,
  type SupplierTruckView,
  type SupplierView,
} from "./types";

// Supplier accounts carry role "supplier" and the pumpId of the pump that created them.
// Every read or write below takes the pumpId or supplierId that the server derived from
// the session, never from client input.
export const SUPPLIER_ACCOUNTS = "supplierAccounts";
export const SUPPLIER_REQUESTS = "supplierRequests";
export const SUPPLIER_TRUCKS = "supplierTrucks";
export const SUPPLIER_PAYMENTS = "supplierPayments";

export type ServiceResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

// The route from supplier to pump. Same shape as the truck route, minus the truck-only origin tag.
export type SupplierRoute = Omit<RouteResult, "originSource">;

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

// Like num, but keeps "no value" as null so the UI can show a dash instead of 0.
function optionalNum(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function validCoordinate(lat: unknown, lng: unknown): { lat: number; lng: number } | null {
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
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
    ratePerLitre: optionalNum(doc.ratePerLitre),
    amount: optionalNum(doc.amount),
    paid: 0,
    remaining: optionalNum(doc.amount),
    truckId: String(doc.truckId ?? ""),
    truckNumber: text(doc.truckNumber),
    driverName: text(doc.driverName),
    assignedAt: iso(doc.assignedAt),
  };
}

// Sums the payments recorded against each request. Payments live in their own collection,
// keyed by requestId, so one request's total never includes another's.
async function paidByRequest(requestIds: ObjectId[]): Promise<Map<string, number>> {
  const totals = new Map<string, number>();
  if (requestIds.length === 0) return totals;
  const db = await getDatabase();
  const rows = await db
    .collection(SUPPLIER_PAYMENTS)
    .aggregate([{ $match: { requestId: { $in: requestIds } } }, { $group: { _id: "$requestId", total: { $sum: "$amount" } } }])
    .toArray();
  for (const row of rows) totals.set(String(row._id), roundMoney(num(row.total)));
  return totals;
}

function withPaid(view: SupplierRequestView, paid: number): SupplierRequestView {
  return {
    ...view,
    paid,
    remaining: view.amount === null ? null : Math.max(0, roundMoney(view.amount - paid)),
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

// The supplier's view: only their own requests, newest first, with payment totals.
export async function listRequestsForSupplier(supplierId: ObjectId): Promise<SupplierRequestView[]> {
  const db = await getDatabase();
  const docs = await db.collection(SUPPLIER_REQUESTS).find({ supplierId }).sort({ sentAt: -1 }).toArray();
  const views = docs.map(toRequestView);
  const paid = await paidByRequest(docs.map((d) => d._id as ObjectId));
  return views.map((v) => withPaid(v, paid.get(v.id) ?? 0));
}

// Moves a request to its next status. The update only matches when the request is still
// in a status the action allows, so two clicks can't both succeed.
// Accept needs the rate per litre; the amount is litres × rate and is stored on the request.
export async function applySupplierAction(
  supplierId: ObjectId,
  requestId: ObjectId,
  action: SupplierAction,
  input: { ratePerLitre?: unknown } = {}
): Promise<ServiceResult<SupplierRequestView>> {
  const db = await getDatabase();
  const rule = SUPPLIER_ACTION_RULES[action];
  const requests = db.collection(SUPPLIER_REQUESTS);

  const existing = await requests.findOne({ _id: requestId, supplierId });
  if (!existing) return { ok: false, status: 404, error: "Request not found" };

  const now = new Date();
  const stamp: Record<string, unknown> = {};
  if (action === "seen") stamp.seenAt = now;
  if (action === "accept" || action === "reject") stamp.respondedAt = now;
  if (action === "deliver") stamp.deliveredAt = now;

  if (action === "accept") {
    const rate = optionalNum(input.ratePerLitre);
    if (rate === null || rate <= 0) return { ok: false, status: 400, error: "Enter the rate per litre" };
    stamp.ratePerLitre = roundMoney(rate);
    stamp.amount = roundMoney(num(existing.litres) * rate);
  }

  const updated = await requests.findOneAndUpdate(
    { _id: requestId, supplierId, status: { $in: rule.from } },
    { $set: { status: rule.to, ...stamp, updatedAt: now } },
    { returnDocument: "after" }
  );
  if (!updated) {
    return { ok: false, status: 409, error: `This request is already ${existing.status}` };
  }
  const paid = await paidByRequest([requestId]);
  return { ok: true, data: withPaid(toRequestView(updated), paid.get(String(requestId)) ?? 0) };
}

// Trucks belonging to this supplier, with Busy when an On the way request is using them.
export async function listSupplierTrucks(supplierId: ObjectId): Promise<SupplierTruckView[]> {
  const db = await getDatabase();
  const trucks = await db.collection(SUPPLIER_TRUCKS).find({ supplierId }).sort({ createdAt: -1 }).toArray();
  const active = await db
    .collection(SUPPLIER_REQUESTS)
    .find({ supplierId, status: SUPPLIER_ASSIGN_RULE.to, truckId: { $exists: true } }, { projection: { truckId: 1 } })
    .toArray();
  const busyBy = new Map<string, string>();
  for (const row of active) busyBy.set(String(row.truckId), String(row._id));

  return trucks.map((t) => {
    const currentRequestId = busyBy.get(String(t._id)) ?? "";
    return {
      id: String(t._id),
      truckNumber: text(t.truckNumber),
      truckType: (t.truckType as SupplierTruckType) ?? "",
      driverName: text(t.driverName),
      busy: currentRequestId !== "",
      currentRequestId,
    };
  });
}

export async function createSupplierTruck(
  supplierId: ObjectId,
  input: { truckNumber: string; truckType: SupplierTruckType; driverName: string }
): Promise<ServiceResult<SupplierTruckView>> {
  const db = await getDatabase();
  const trucks = db.collection(SUPPLIER_TRUCKS);
  const truckNumber = input.truckNumber.trim().toUpperCase();

  const duplicate = await trucks.findOne({ supplierId, truckNumber }, { projection: { _id: 1 } });
  if (duplicate) return { ok: false, status: 409, error: "A truck with this number is already added" };

  const now = new Date();
  const doc = {
    supplierId,
    truckNumber,
    truckType: input.truckType,
    driverName: input.driverName.trim(),
    createdAt: now,
    updatedAt: now,
  };
  const result = await trucks.insertOne(doc);
  return {
    ok: true,
    data: { id: String(result.insertedId), truckNumber, truckType: input.truckType, driverName: doc.driverName, busy: false, currentRequestId: "" },
  };
}

// Puts an accepted request On the way with one of this supplier's Free trucks.
export async function assignSupplierTruck(
  supplierId: ObjectId,
  requestId: ObjectId,
  truckId: ObjectId
): Promise<ServiceResult<SupplierRequestView>> {
  const db = await getDatabase();
  const requests = db.collection(SUPPLIER_REQUESTS);

  const request = await requests.findOne({ _id: requestId, supplierId });
  if (!request) return { ok: false, status: 404, error: "Request not found" };
  if (!SUPPLIER_ASSIGN_RULE.from.includes(request.status as SupplierRequestStatus)) {
    return { ok: false, status: 409, error: `This request is ${request.status}. Accept it before choosing a truck.` };
  }

  const truck = await db.collection(SUPPLIER_TRUCKS).findOne({ _id: truckId, supplierId });
  if (!truck) return { ok: false, status: 404, error: "Truck not found" };

  const busy = await requests.findOne({ supplierId, truckId, status: SUPPLIER_ASSIGN_RULE.to }, { projection: { _id: 1 } });
  if (busy) return { ok: false, status: 409, error: "This truck is busy" };

  const now = new Date();
  const updated = await requests.findOneAndUpdate(
    { _id: requestId, supplierId, status: { $in: SUPPLIER_ASSIGN_RULE.from } },
    {
      $set: {
        status: SUPPLIER_ASSIGN_RULE.to,
        truckId,
        truckNumber: text(truck.truckNumber),
        driverName: text(truck.driverName),
        assignedAt: now,
        updatedAt: now,
      },
    },
    { returnDocument: "after" }
  );
  if (!updated) return { ok: false, status: 409, error: "This request was already changed" };

  // Two requests could pick the same free truck at the same moment. If that happened, undo this one.
  const clashes = await requests.countDocuments({ supplierId, truckId, status: SUPPLIER_ASSIGN_RULE.to });
  if (clashes > 1) {
    await requests.updateOne(
      { _id: requestId, supplierId, truckId },
      {
        $set: { status: SUPPLIER_ASSIGN_RULE.from[0], updatedAt: new Date() },
        $unset: { truckId: "", truckNumber: "", driverName: "", assignedAt: "" },
      }
    );
    return { ok: false, status: 409, error: "This truck is busy" };
  }

  const paid = await paidByRequest([requestId]);
  return { ok: true, data: withPaid(toRequestView(updated), paid.get(String(requestId)) ?? 0) };
}

// Records money received against one of this supplier's requests. The amount can't be more than what is left.
export async function recordSupplierPayment(
  supplierId: ObjectId,
  requestId: ObjectId,
  amount: number
): Promise<ServiceResult<SupplierRequestView>> {
  const db = await getDatabase();
  const request = await db.collection(SUPPLIER_REQUESTS).findOne({ _id: requestId, supplierId });
  if (!request) return { ok: false, status: 404, error: "Request not found" };

  const total = optionalNum(request.amount);
  if (total === null) return { ok: false, status: 409, error: "Accept the request and enter the rate first" };

  const paid = (await paidByRequest([requestId])).get(String(requestId)) ?? 0;
  const remaining = roundMoney(total - paid);
  if (remaining <= 0) return { ok: false, status: 409, error: "Nothing is left to pay on this request" };
  if (amount > remaining) return { ok: false, status: 400, error: `Amount is more than the remaining balance of ${remaining}` };

  const now = new Date();
  await db.collection(SUPPLIER_PAYMENTS).insertOne({
    supplierId,
    requestId,
    pumpId: request.pumpId,
    amount: roundMoney(amount),
    receivedAt: now,
    createdAt: now,
  });

  const updatedPaid = (await paidByRequest([requestId])).get(String(requestId)) ?? 0;
  return { ok: true, data: withPaid(toRequestView(request), updatedPaid) };
}

// The delivery route from the supplier's location to the pump. Returns null when either
// location is missing or OSRM can't answer, so nothing is estimated.
export async function getSupplierRequestRoute(
  supplierId: ObjectId,
  requestId: ObjectId
): Promise<ServiceResult<{ route: SupplierRoute | null }>> {
  const db = await getDatabase();
  const request = await db.collection(SUPPLIER_REQUESTS).findOne({ _id: requestId, supplierId }, { projection: { pumpId: 1, status: 1 } });
  if (!request) return { ok: false, status: 404, error: "Request not found" };
  if (request.status !== SUPPLIER_ASSIGN_RULE.to) return { ok: true, data: { route: null } };

  const supplier = await db.collection(SUPPLIER_ACCOUNTS).findOne({ _id: supplierId }, { projection: { latitude: 1, longitude: 1 } });
  const pump = await db.collection("pumps").findOne({ _id: request.pumpId as ObjectId }, { projection: { latitude: 1, longitude: 1 } });
  const origin = validCoordinate(supplier?.latitude, supplier?.longitude);
  const destination = validCoordinate(pump?.latitude, pump?.longitude);
  if (!origin || !destination) return { ok: true, data: { route: null } };

  const route = await fetchRoute(origin, destination);
  return { ok: true, data: { route } };
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
