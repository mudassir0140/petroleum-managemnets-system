import crypto from "crypto";
import { ObjectId, type Document, type WithId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  ACTIVE_TRIP_STATUSES,
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
    .find({ truckId, status: { $in: [...ACTIVE_TRIP_STATUSES] } })
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

// Stores the driver's latest position. The owner's page reads it back for the map.
export async function recordTruckLocation(truckId: ObjectId, loc: { lat: number; lng: number; accuracy: number }) {
  const db = await getDatabase();
  await db.collection(TRUCKS).updateOne(
    { _id: truckId },
    { $set: { lastLocation: { lat: loc.lat, lng: loc.lng, accuracy: loc.accuracy, at: new Date() }, updatedAt: new Date() } }
  );
}

// Sets every truck on these orders back to Free. Called when an order is completed or cancelled.
export async function releaseTrucksForOrder(orderId: ObjectId): Promise<void> {
  const db = await getDatabase();
  await db.collection(TRUCKS).updateMany(
    { currentOrderId: orderId },
    { $set: { status: "available", currentOrderId: null, currentPumpId: null, updatedAt: new Date() } }
  );
}
