import crypto from "crypto";
import { ObjectId, type Document, type WithId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import { hasArrived } from "./gps";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  TRUCK_STATUS_TO_AVAILABILITY,
  type TruckAvailability,
  type TruckLocation,
  type TruckOrderView,
  type TruckTripView,
  type TruckType,
  type TruckView,
} from "./types";

// Trucks live in the existing `trucks` collection. A truck's owner pump is stored as
// pumpId, and its driver login is the username, passwordHash and sessionToken fields.
// Free and Busy use the same status values the admin assignment routes already write.
export const TRUCKS = "trucks";
const ORDERS = "orders";
const PUMPS = "pumps";

export type ServiceResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function num(value: unknown): number {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? ""));
  return Number.isFinite(n) ? n : 0;
}

function iso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : "";
}

function slugPart(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Username: <pump name>-<truck number>, lowercase, with a number added if already taken.
export async function buildTruckUsername(pumpName: string, truckNumber: string): Promise<string> {
  const db = await getDatabase();
  const base = `${slugPart(pumpName) || "pump"}-${slugPart(truckNumber) || "truck"}`;
  let candidate = base;
  let counter = 2;
  while (await db.collection(TRUCKS).findOne({ username: candidate }, { projection: { _id: 1 } })) {
    candidate = `${base}${counter}`;
    counter++;
  }
  return candidate;
}

async function pumpNames(pumpIds: ObjectId[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (pumpIds.length === 0) return map;
  const db = await getDatabase();
  const pumps = await db.collection(PUMPS).find({ _id: { $in: pumpIds } }, { projection: { name: 1 } }).toArray();
  for (const p of pumps) map.set(String(p._id), text(p.name));
  return map;
}

function toTripView(order: WithId<Document>, pickupPump: string): TruckTripView {
  return {
    orderId: String(order._id),
    orderNumber: text(order.trackingNumber) || `ORD-${String(order._id).slice(-6).toUpperCase()}`,
    fuelType: order.fuelType === "diesel" ? "diesel" : "petrol",
    quantityLitres: num(order.quantityLitres),
    pickupPump,
    destinationPump: text(order.pumpName),
    orderStatus: text(order.status),
    requestedAt: iso(order.requestedAt),
    expectedArrival: iso(order.expectedArrival),
    driverResponse: order.driverResponse ?? "accepted",
    driverConfirmed: !!order.driverConfirmedAt,
  };
}

function toLocation(value: unknown): TruckLocation | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (typeof v.lat !== "number" || typeof v.lng !== "number") return null;
  return { lat: v.lat, lng: v.lng, accuracy: num(v.accuracy), at: iso(v.at) || text(v.at) };
}

// The truck's active trip: the newest order on it that is still in an active status.
async function activeTripFor(truckId: ObjectId, truckPumpName: string): Promise<TruckTripView | null> {
  const db = await getDatabase();
  const order = await db
    .collection(ORDERS)
    .find({ truckId, status: { $in: [...BUSY_ORDER_STATUSES] }, driverResponse: { $ne: "rejected" } })
    .sort({ requestedAt: -1 })
    .limit(1)
    .next();
  return order ? toTripView(order, truckPumpName) : null;
}

function availabilityOf(status: unknown): TruckAvailability {
  return TRUCK_STATUS_TO_AVAILABILITY[text(status)] ?? "free";
}

// Every truck owned by this pump, with its availability, active trip and last location.
export async function listTrucksForPump(pumpId: ObjectId): Promise<TruckView[]> {
  const db = await getDatabase();
  const trucks = await db.collection(TRUCKS).find({ pumpId }).sort({ createdAt: -1 }).toArray();
  const pumpName = (await pumpNames([pumpId])).get(String(pumpId)) ?? "";

  const views: TruckView[] = [];
  for (const t of trucks) {
    views.push({
      id: String(t._id),
      driverName: text(t.driverName),
      phone: text(t.phone),
      truckNumber: text(t.registrationNumber) || text(t.name),
      truckType: (t.truckType === "long" || t.truckType === "short" ? t.truckType : "") as TruckType | "",
      username: text(t.username),
      pumpId: String(pumpId),
      pumpName,
      availability: availabilityOf(t.status),
      currentTrip: await activeTripFor(t._id as ObjectId, pumpName),
      location: toLocation(t.lastLocation),
      createdAt: iso(t.createdAt),
    });
  }
  return views;
}

export async function getTruckForPump(pumpId: ObjectId, truckId: ObjectId): Promise<TruckView | null> {
  const trucks = await listTrucksForPump(pumpId);
  return trucks.find((t) => t.id === String(truckId)) ?? null;
}

// Every order the truck has carried, newest first: the truck's full order history.
export async function listOrdersForTruck(pumpId: ObjectId, truckId: ObjectId): Promise<TruckOrderView[]> {
  const db = await getDatabase();
  const pumpName = (await pumpNames([pumpId])).get(String(pumpId)) ?? "";
  const orders = await db.collection(ORDERS).find({ truckId }).sort({ requestedAt: -1 }).toArray();
  return orders.map((o) => ({
    orderId: String(o._id),
    orderNumber: text(o.trackingNumber) || `ORD-${String(o._id).slice(-6).toUpperCase()}`,
    fuelType: o.fuelType === "diesel" ? "diesel" : "petrol",
    quantityLitres: num(o.quantityLitres),
    pickupPump: pumpName,
    destinationPump: text(o.pumpName),
    status: text(o.status),
    requestedAt: iso(o.requestedAt),
    expectedArrival: iso(o.expectedArrival),
    deliveredAt: iso(o.deliveredAt),
    driverResponse: o.driverResponse ?? "accepted",
    driverConfirmed: !!o.driverConfirmedAt,
  }));
}

// Trips in progress for this pump's trucks: the upcoming and active assigned trips.
export async function listUpcomingTripsForPump(pumpId: ObjectId) {
  const trucks = await listTrucksForPump(pumpId);
  return trucks.filter((t) => t.currentTrip !== null && t.availability === "busy");
}

export async function createTruck(
  pumpId: ObjectId,
  input: { driverName: string; truckNumber: string; truckType: TruckType; phone: string; password: string }
): Promise<ServiceResult<TruckView>> {
  const db = await getDatabase();
  const pumpName = (await pumpNames([pumpId])).get(String(pumpId)) ?? "";
  if (!pumpName) return { ok: false, status: 404, error: "Pump not found" };

  const trucks = db.collection(TRUCKS);
  await trucks.createIndex({ username: 1 }, { unique: true, sparse: true });

  const username = await buildTruckUsername(pumpName, input.truckNumber);
  const now = new Date();
  const doc = {
    name: input.truckNumber,
    registrationNumber: input.truckNumber,
    driverName: input.driverName,
    phone: input.phone,
    truckType: input.truckType,
    pumpId,
    username,
    passwordHash: hashPassword(input.password),
    sessionToken: null,
    status: "available",
    createdAt: now,
    updatedAt: now,
  };
  const result = await trucks.insertOne(doc);
  return {
    ok: true,
    data: {
      id: String(result.insertedId),
      driverName: input.driverName,
      phone: input.phone,
      truckNumber: input.truckNumber,
      truckType: input.truckType,
      username,
      pumpId: String(pumpId),
      pumpName,
      availability: "free",
      currentTrip: null,
      location: null,
      createdAt: now.toISOString(),
    },
  };
}

// The owner sets a new driver password. The plain password is returned once and never stored.
export async function resetTruckPassword(
  pumpId: ObjectId,
  truckId: ObjectId
): Promise<ServiceResult<{ username: string; password: string }>> {
  const db = await getDatabase();
  const password = crypto.randomBytes(9).toString("base64url").slice(0, 12);
  const updated = await db.collection(TRUCKS).findOneAndUpdate(
    { _id: truckId, pumpId },
    { $set: { passwordHash: hashPassword(password), sessionToken: null, updatedAt: new Date() } },
    { returnDocument: "after", projection: { username: 1 } }
  );
  if (!updated) return { ok: false, status: 404, error: "Truck not found" };
  return { ok: true, data: { username: text(updated.username), password } };
}

// Driver login. Returns a session token on success.
export async function authenticateTruck(
  username: string,
  password: string
): Promise<ServiceResult<{ token: string; truck: WithId<Document> }>> {
  const db = await getDatabase();
  const trucks = db.collection(TRUCKS);
  const truck = await trucks.findOne({ username: username.trim().toLowerCase() });
  if (!truck || typeof truck.passwordHash !== "string") return { ok: false, status: 401, error: "Account not found" };
  if (!verifyPassword(password, truck.passwordHash)) return { ok: false, status: 401, error: "Wrong password" };

  const token = crypto.randomBytes(32).toString("hex");
  await trucks.updateOne({ _id: truck._id }, { $set: { sessionToken: token, lastLoginAt: new Date() } });
  return { ok: true, data: { token, truck } };
}

export async function endTruckSession(token: string): Promise<void> {
  const db = await getDatabase();
  await db.collection(TRUCKS).updateOne({ sessionToken: token }, { $set: { sessionToken: null } });
}

// The driver's own truck and trip, found by the session token.
export async function getTruckForDriver(truckId: ObjectId): Promise<TruckView | null> {
  const db = await getDatabase();
  const truck = await db.collection(TRUCKS).findOne({ _id: truckId });
  if (!truck || !(truck.pumpId instanceof ObjectId)) return null;
  return getTruckForPump(truck.pumpId, truckId);
}

// Stores the driver's latest position, then moves the active trip along: on the way once a position arrives,
// and arrived when a fresh, accurate position is inside the arrival radius of the destination pump.
export async function recordTruckLocation(truckId: ObjectId, loc: { lat: number; lng: number; accuracy: number }) {
  const db = await getDatabase();
  const now = new Date();
  await db.collection(TRUCKS).updateOne(
    { _id: truckId },
    { $set: { lastLocation: { lat: loc.lat, lng: loc.lng, accuracy: loc.accuracy, at: now }, updatedAt: now } }
  );
  await applyLocationToTrip(truckId, loc, now);
}

async function applyLocationToTrip(truckId: ObjectId, loc: { lat: number; lng: number; accuracy: number }, now: Date) {
  const db = await getDatabase();
  const orders = db.collection(ORDERS);
  const trip = await orders.findOne(
    {
      truckId,
      status: { $in: ["accepted", "dispatched", "on-the-way"] },
      $or: [{ driverResponse: "accepted" }, { driverResponse: { $exists: false } }],
    },
    { sort: { requestedAt: -1 } }
  );
  if (!trip) return;

  await orders.updateOne({ _id: trip._id, status: { $in: ["accepted", "dispatched"] } }, { $set: { status: "on-the-way", updatedAt: now } });

  const pump = await db.collection(PUMPS).findOne({ _id: trip.pumpId }, { projection: { latitude: 1, longitude: 1 } });
  if (!pump || typeof pump.latitude !== "number" || typeof pump.longitude !== "number") return;
  if (!hasArrived({ lat: loc.lat, lng: loc.lng, accuracy: loc.accuracy }, { lat: pump.latitude, lng: pump.longitude })) return;

  await orders.updateOne(
    { _id: trip._id, status: { $in: ["accepted", "dispatched", "on-the-way"] } },
    { $set: { status: "delivered", arrivedAt: now, arrivalSource: "gps", deliveredAt: now, updatedAt: now } }
  );
}

// Order statuses that keep a truck on a trip. A truck is Busy only with an accepted trip in one of these.
export const BUSY_ORDER_STATUSES = ["accepted", "dispatched", "on-the-way", "delivered"] as const;

// Recomputes a truck's status from its orders: Busy while it has an accepted trip in progress, otherwise Free.
// Orders assigned before driverResponse existed count as accepted, as they did before.
export async function syncTruckAvailability(truckId: ObjectId): Promise<void> {
  const db = await getDatabase();
  const busy = await db.collection(ORDERS).findOne(
    {
      truckId,
      status: { $in: [...BUSY_ORDER_STATUSES] },
      $or: [{ driverResponse: "accepted" }, { driverResponse: { $exists: false } }],
    },
    { sort: { requestedAt: -1 }, projection: { pumpId: 1 } }
  );
  // A truck held by a supplier request (sent on by its driver, or accepted) stays Busy as well.
  const supplierBusy = await db
    .collection("supplierRequests")
    .findOne({ truckId, status: { $in: ["pending-supplier", "accepted", "on-the-way", "arrived"] } }, { projection: { _id: 1 } });
  if (busy) {
    await db.collection(TRUCKS).updateOne(
      { _id: truckId },
      { $set: { status: "in-transit", currentOrderId: busy._id, currentPumpId: busy.pumpId, updatedAt: new Date() } }
    );
  } else if (supplierBusy) {
    await db.collection(TRUCKS).updateOne(
      { _id: truckId },
      { $set: { status: "in-transit", currentOrderId: null, currentPumpId: null, updatedAt: new Date() } }
    );
  } else {
    await db.collection(TRUCKS).updateOne(
      { _id: truckId },
      { $set: { status: "available", currentOrderId: null, currentPumpId: null, updatedAt: new Date() } }
    );
  }
}

// Frees the trucks on this order when it is completed or cancelled. A truck stays Busy if it has another accepted trip.
export async function releaseTrucksForOrder(orderId: ObjectId): Promise<void> {
  const db = await getDatabase();
  const order = await db.collection(ORDERS).findOne({ _id: orderId }, { projection: { truckId: 1 } });
  const truckIds = new Set<string>();
  if (order?.truckId instanceof ObjectId) truckIds.add(String(order.truckId));
  const linked = await db.collection(TRUCKS).find({ currentOrderId: orderId }, { projection: { _id: 1 } }).toArray();
  for (const t of linked) truckIds.add(String(t._id));
  for (const id of truckIds) await syncTruckAvailability(new ObjectId(id));
}

// The driver accepts or rejects an assigned trip. Accept makes the truck Busy; Reject returns the order to pending.
export async function respondToTrip(
  truckId: ObjectId,
  orderId: ObjectId,
  action: "accept" | "reject"
): Promise<ServiceResult<{ status: "accepted" | "rejected" }>> {
  const db = await getDatabase();
  const orders = db.collection(ORDERS);
  const order = await orders.findOne({ _id: orderId, truckId });
  if (!order) return { ok: false, status: 404, error: "Trip not found" };

  const current = order.driverResponse ?? "accepted";
  if (current !== "pending") return { ok: false, status: 409, error: "This trip is already " + current };

  const now = new Date();
  const filter = { _id: orderId, truckId, driverResponse: "pending" };
  const result =
    action === "accept"
      ? await orders.updateOne(filter, { $set: { driverResponse: "accepted", respondedAt: now, updatedAt: now } })
      : await orders.updateOne(filter, {
          $set: { driverResponse: "rejected", status: "pending", respondedAt: now, updatedAt: now },
          $unset: { truckId: "", truckName: "", driverId: "", driverName: "", expectedArrival: "", dispatchedAt: "" },
        });
  if (result.modifiedCount === 0) return { ok: false, status: 409, error: "This trip was already answered" };

  await syncTruckAvailability(truckId);
  return { ok: true, data: { status: action === "accept" ? "accepted" : "rejected" } };
}

// The driver reports the delivery from their own login. This marks the trip as arrived. Only the destination
// pump's owner completes a delivery, and the truck becomes Free only then.
export async function confirmTripByDriver(truckId: ObjectId, orderId: ObjectId): Promise<ServiceResult<{ completed: boolean }>> {
  const db = await getDatabase();
  const orders = db.collection(ORDERS);
  const order = await orders.findOne({ _id: orderId, truckId });
  if (!order) return { ok: false, status: 404, error: "Trip not found" };
  if ((order.driverResponse ?? "accepted") !== "accepted") return { ok: false, status: 409, error: "Accept the trip before confirming delivery" };
  if (order.driverConfirmedAt) return { ok: false, status: 409, error: "Delivery is already confirmed" };
  if (!(BUSY_ORDER_STATUSES as readonly string[]).includes(String(order.status))) {
    return { ok: false, status: 409, error: "This order is " + order.status };
  }

  const now = new Date();
  await orders.updateOne(
    { _id: orderId, truckId, driverConfirmedAt: { $exists: false } },
    {
      $set: {
        driverConfirmedAt: now,
        status: "delivered",
        updatedAt: now,
        ...(order.arrivedAt ? {} : { arrivedAt: now, arrivalSource: "driver", deliveredAt: now }),
      },
    }
  );
  return { ok: true, data: { completed: false } };
}

// The pump cancels one of its own orders. The truck becomes Free unless it has another accepted trip.
export async function cancelOrderForPump(pumpId: ObjectId, orderId: ObjectId): Promise<ServiceResult<{ status: "cancelled" }>> {
  const db = await getDatabase();
  const orders = db.collection(ORDERS);
  const order = await orders.findOne({ _id: orderId, pumpId });
  if (!order) return { ok: false, status: 404, error: "Order not found" };
  if (order.status === "completed" || order.status === "cancelled") {
    return { ok: false, status: 409, error: "This order is already " + order.status };
  }

  const now = new Date();
  await orders.updateOne({ _id: orderId, pumpId, status: { $nin: ["completed", "cancelled"] } }, { $set: { status: "cancelled", cancelledAt: now, updatedAt: now } });
  await releaseTrucksForOrder(orderId);
  return { ok: true, data: { status: "cancelled" } };
}
