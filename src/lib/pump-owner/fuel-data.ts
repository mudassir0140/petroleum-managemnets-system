import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import type { StockHistoryEntry, StockSnapshot, IncomingTanker, TankerStatus } from "@/lib/types";

// Live data for the Pump Owner dashboard. Everything is read from MongoDB and
// scoped to one pump, the pump id that comes from the logged-in owner's session.
// Nothing here is hardcoded or demo data.

const ORDERS = "orders";
const SALES = "sales";
const TRUCKS = "trucks";
const PUMPS = "pumps";

// Orders that are still to arrive. Delivered and later orders are history, not upcoming trucks.
export const UPCOMING_ORDER_STATUSES = ["accepted", "dispatched", "on-the-way"] as const;

function toObjectId(value: string): ObjectId | null {
  return /^[a-f0-9]{24}$/i.test(value) ? new ObjectId(value) : null;
}

function num(value: unknown): number {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? ""));
  return Number.isFinite(n) ? n : 0;
}

function isoOrEmpty(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return "";
}

// Order numbers come from the tracking number when there is one, otherwise from the order id.
export function orderNumberFor(order: { trackingNumber?: unknown; _id?: unknown }): string {
  const tracking = typeof order.trackingNumber === "string" ? order.trackingNumber.trim() : "";
  if (tracking) return tracking;
  return `ORD-${String(order._id ?? "").slice(-6).toUpperCase()}`;
}

// Petrol and diesel levels live on the pump record. No other fuel types are recorded there.
export async function getPumpFuelStock(pumpId: string): Promise<StockSnapshot[]> {
  const id = toObjectId(pumpId);
  if (!id) return [];
  const db = await getDatabase();
  const pump = await db.collection(PUMPS).findOne({ _id: id }, { projection: { petrolStock: 1, petrolCapacity: 1, dieselStock: 1, dieselCapacity: 1 } });
  if (!pump) return [];

  return [
    { fuel: "petrol", currentLitres: num(pump.petrolStock), capacityLitres: num(pump.petrolCapacity), receivedLitres7d: 0, soldLitres7d: 0, reorderLevelLitres: 0 },
    { fuel: "diesel", currentLitres: num(pump.dieselStock), capacityLitres: num(pump.dieselCapacity), receivedLitres7d: 0, soldLitres7d: 0, reorderLevelLitres: 0 },
  ];
}

// Truck registration numbers for a set of truck ids.
async function truckNumbersById(truckIds: ObjectId[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (truckIds.length === 0) return map;
  const db = await getDatabase();
  const trucks = await db.collection(TRUCKS).find({ _id: { $in: truckIds } }, { projection: { registrationNumber: 1, name: 1 } }).toArray();
  for (const t of trucks) {
    map.set(String(t._id), (t.registrationNumber as string) || (t.name as string) || "");
  }
  return map;
}

export interface PumpOrderView {
  id: string;
  orderNumber: string;
  fuelType: "petrol" | "diesel";
  quantityLitres: number;
  truckNumber: string;
  driverName: string;
  status: string;
  requestedAt: string;
  expectedArrival: string;
  totalAmount: number | null;
}

// Every order for this pump, newest first, shaped for the order table.
export async function getPumpOrderViews(pumpId: string): Promise<PumpOrderView[]> {
  const id = toObjectId(pumpId);
  if (!id) return [];
  const db = await getDatabase();
  const orders = await db.collection(ORDERS).find({ pumpId: id }).sort({ requestedAt: -1 }).toArray();
  const truckIds = orders.map((o) => o.truckId).filter((t): t is ObjectId => t instanceof ObjectId);
  const trucks = await truckNumbersById(truckIds);

  return orders.map((o) => ({
    id: String(o._id),
    orderNumber: orderNumberFor(o),
    fuelType: o.fuelType,
    quantityLitres: num(o.quantityLitres),
    truckNumber: (o.truckId && trucks.get(String(o.truckId))) || (o.truckName as string) || "",
    driverName: (o.driverName as string) || "",
    status: o.status,
    requestedAt: isoOrEmpty(o.requestedAt),
    expectedArrival: isoOrEmpty(o.expectedArrival),
    totalAmount: typeof o.totalAmount === "number" ? o.totalAmount : null,
  }));
}

// Trucks still on their way to this pump, earliest arrival first.
export async function getUpcomingTrucks(pumpId: string): Promise<PumpOrderView[]> {
  const all = await getPumpOrderViews(pumpId);
  return all
    .filter((o) => (UPCOMING_ORDER_STATUSES as readonly string[]).includes(o.status))
    .sort((a, b) => (a.expectedArrival || a.requestedAt).localeCompare(b.expectedArrival || b.requestedAt));
}

// The Tankers board shape, built from upcoming orders.
export function upcomingAsTankers(trucks: PumpOrderView[]): IncomingTanker[] {
  const statusFor: Record<string, TankerStatus> = {
    accepted: "scheduled",
    dispatched: "in_transit",
    "on-the-way": "arriving_soon",
  };
  return trucks.map((t) => ({
    id: t.id,
    tankerNumber: t.truckNumber || "—",
    driverName: t.driverName || "—",
    driverPhone: "",
    fuel: t.fuelType,
    expectedLitres: t.quantityLitres,
    expectedArrival: t.expectedArrival || t.requestedAt,
    status: statusFor[t.status] ?? "scheduled",
    supplier: "",
  }));
}

// Received stock comes from delivered orders; sold stock comes from the daily sales records.
export async function getStockHistory(pumpId: string, days: number): Promise<StockHistoryEntry[]> {
  const id = toObjectId(pumpId);
  if (!id) return [];
  const db = await getDatabase();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const sinceDate = since.toISOString().slice(0, 10);

  const delivered = await db
    .collection(ORDERS)
    .find({ pumpId: id, deliveredAt: { $gte: since } })
    .sort({ deliveredAt: -1 })
    .toArray();

  const sales = await db
    .collection(SALES)
    .find({ pumpId: id, date: { $gte: sinceDate } })
    .sort({ date: -1 })
    .toArray();

  const entries: StockHistoryEntry[] = [];
  for (const o of delivered) {
    entries.push({
      id: `in-${String(o._id)}`,
      date: isoOrEmpty(o.deliveredAt),
      fuel: o.fuelType,
      type: "received",
      litres: num(o.quantityLitres),
      note: `Delivery ${orderNumberFor(o)}`,
    });
  }
  for (const s of sales) {
    if (num(s.petrolLitres) > 0) {
      entries.push({ id: `sold-p-${String(s._id)}`, date: `${s.date}T00:00:00.000Z`, fuel: "petrol", type: "sold", litres: num(s.petrolLitres), note: `${s.shift} shift` });
    }
    if (num(s.dieselLitres) > 0) {
      entries.push({ id: `sold-d-${String(s._id)}`, date: `${s.date}T00:00:00.000Z`, fuel: "diesel", type: "sold", litres: num(s.dieselLitres), note: `${s.shift} shift` });
    }
  }
  return entries.sort((a, b) => b.date.localeCompare(a.date));
}

// Litres received and sold over the last seven days, per fuel type.
export async function getSevenDayTotals(pumpId: string): Promise<Record<"petrol" | "diesel", { received: number; sold: number }>> {
  const totals = { petrol: { received: 0, sold: 0 }, diesel: { received: 0, sold: 0 } };
  const id = toObjectId(pumpId);
  if (!id) return totals;
  const db = await getDatabase();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const sinceDate = since.toISOString().slice(0, 10);

  const delivered = await db.collection(ORDERS).find({ pumpId: id, deliveredAt: { $gte: since } }).toArray();
  for (const o of delivered) {
    const fuel = o.fuelType === "diesel" ? "diesel" : "petrol";
    totals[fuel].received += num(o.quantityLitres);
  }

  const sales = await db.collection(SALES).find({ pumpId: id, date: { $gte: sinceDate } }).toArray();
  for (const s of sales) {
    totals.petrol.sold += num(s.petrolLitres);
    totals.diesel.sold += num(s.dieselLitres);
  }
  return totals;
}
