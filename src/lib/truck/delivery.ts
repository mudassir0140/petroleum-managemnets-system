import { ObjectId, type Document, type WithId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import { releaseTrucksForOrder, TRUCKS, type ServiceResult } from "./service";
import { tripStage, type TripStage } from "./gps";

// Orders are stored in the existing "orders" collection. Order status moves:
//   accepted/dispatched -> on-the-way (first GPS position) -> delivered (arrived) -> completed (owner confirms).
// Only the destination pump's owner can complete a delivery. Completing frees the truck.
const ORDERS = "orders";
const NOTIFICATIONS = "notifications";
export const DELIVERY_NOTIFICATION = "delivery-completed";

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function formatWhen(value: Date | undefined): string {
  return value ? value.toLocaleString("en-PK") : "—";
}

// Called after the destination owner confirms. The truck's pump gets the full delivery details.
async function notifyTruckOwnerOfDelivery(order: WithId<Document>, confirmedAt: Date): Promise<void> {
  const db = await getDatabase();
  const truck = await db
    .collection(TRUCKS)
    .findOne({ _id: order.truckId }, { projection: { registrationNumber: 1, name: 1, driverName: 1, pumpId: 1 } });
  if (!truck || !(truck.pumpId instanceof ObjectId)) return;

  const pickup = await db.collection("pumps").findOne({ _id: truck.pumpId }, { projection: { name: 1 } });
  const pickupName = text(pickup?.name) || "—";
  const destinationName = text(order.pumpName) || "—";
  const truckNumber = text(truck.registrationNumber) || text(truck.name) || "—";
  const driverName = text(truck.driverName) || text(order.driverName) || "—";
  const orderNumber = text(order.trackingNumber) || `ORD-${String(order._id).slice(-6).toUpperCase()}`;
  const fuel = order.fuelType === "diesel" ? "Diesel" : "Petrol";
  const litres = Number(order.quantityLitres) || 0;
  const arrivedAt = order.arrivedAt instanceof Date ? order.arrivedAt : undefined;
  const via = order.arrivalSource === "gps" ? "GPS arrival" : "driver confirmation";
  const message = `${orderNumber}: ${litres.toLocaleString()} L ${fuel} delivered from ${pickupName} to ${destinationName} by truck ${truckNumber} (driver ${driverName}). Arrived ${formatWhen(arrivedAt)} (${via}). Confirmed by ${destinationName} at ${formatWhen(confirmedAt)}.`;

  const now = new Date();
  await db.collection(NOTIFICATIONS).updateOne(
    { dedupeKey: `${DELIVERY_NOTIFICATION}:${order._id}` },
    {
      $setOnInsert: {
        dedupeKey: `${DELIVERY_NOTIFICATION}:${order._id}`,
        recipientId: truck.pumpId,
        recipientType: "pump-owner",
        type: DELIVERY_NOTIFICATION,
        pumpId: truck.pumpId,
        title: "Delivery completed / ترسیل مکمل",
        message,
        data: {
          orderId: String(order._id),
          orderNumber,
          pickupCompany: pickupName,
          destinationPump: destinationName,
          truckNumber,
          driverName,
          fuelType: fuel.toLowerCase(),
          quantityLitres: litres,
          arrivedAt: arrivedAt?.toISOString() ?? "",
          arrivalSource: text(order.arrivalSource),
          confirmedAt: confirmedAt.toISOString(),
        },
        read: false,
        createdAt: now,
        updatedAt: now,
      },
    },
    { upsert: true }
  );
}

// The destination owner confirms that the truck's fuel has been delivered.
export async function confirmDeliveryAsDestination(pumpId: ObjectId, orderId: ObjectId): Promise<ServiceResult<{ orderId: string; status: "completed" }>> {
  const db = await getDatabase();
  const orders = db.collection(ORDERS);
  const order = await orders.findOne({ _id: orderId, pumpId });
  if (!order) return { ok: false, status: 404, error: "Order not found" };
  if (order.status === "completed") return { ok: false, status: 409, error: "This delivery is already confirmed" };
  if (order.status === "cancelled") return { ok: false, status: 409, error: "This order is cancelled" };
  if (order.status !== "delivered") {
    return { ok: false, status: 409, error: "The truck has not arrived yet. Confirm after it arrives. / ٹرک ابھی نہیں پہنچا" };
  }

  const now = new Date();
  const updated = await orders.findOneAndUpdate(
    { _id: orderId, pumpId, status: "delivered" },
    { $set: { status: "completed", pumpOwnerConfirmedAt: now, completedAt: now, updatedAt: now } },
    { returnDocument: "after" }
  );
  if (!updated) return { ok: false, status: 409, error: "This delivery was already changed" };

  // The order is no longer active, so the truck becomes Free (unless it has another trip).
  if (updated.truckId instanceof ObjectId) await releaseTrucksForOrder(orderId);
  try {
    await notifyTruckOwnerOfDelivery(updated, now);
  } catch (error) {
    console.error("[Delivery] notification failed:", error);
  }
  return { ok: true, data: { orderId: String(orderId), status: "completed" } };
}

export interface IncomingDelivery {
  orderId: string;
  orderNumber: string;
  truckId: string;
  truckNumber: string;
  driverName: string;
  pickupCompany: string;
  fuelType: "petrol" | "diesel";
  quantityLitres: number;
  stage: TripStage;
  arrivedAt: string;
  expectedArrival: string;
}

// Deliveries coming to this pump: active orders whose truck is on the way or has arrived.
export async function listIncomingForPump(pumpId: ObjectId): Promise<IncomingDelivery[]> {
  const db = await getDatabase();
  const orders = await db
    .collection(ORDERS)
    .find({
      pumpId,
      truckId: { $exists: true },
      status: { $in: ["accepted", "dispatched", "on-the-way", "delivered"] },
      $or: [{ driverResponse: "accepted" }, { driverResponse: { $exists: false } }],
    })
    .sort({ requestedAt: -1 })
    .limit(20)
    .toArray();
  if (orders.length === 0) return [];

  const truckIds = [...new Set(orders.map((o) => String(o.truckId)))].map((id) => new ObjectId(id));
  const trucks = await db
    .collection(TRUCKS)
    .find({ _id: { $in: truckIds } }, { projection: { registrationNumber: 1, name: 1, driverName: 1, pumpId: 1 } })
    .toArray();
  const truckById = new Map(trucks.map((t) => [String(t._id), t]));
  const pumpIds = [...new Set(trucks.map((t) => String(t.pumpId)))].filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
  const pumps = await db.collection("pumps").find({ _id: { $in: pumpIds } }, { projection: { name: 1 } }).toArray();
  const pumpName = new Map(pumps.map((p) => [String(p._id), text(p.name)]));

  const rows: IncomingDelivery[] = [];
  for (const o of orders) {
    const stage = tripStage(text(o.status));
    const truck = truckById.get(String(o.truckId));
    if (!stage || !truck) continue;
    rows.push({
      orderId: String(o._id),
      orderNumber: text(o.trackingNumber) || `ORD-${String(o._id).slice(-6).toUpperCase()}`,
      truckId: String(o.truckId),
      truckNumber: text(truck.registrationNumber) || text(truck.name) || "—",
      driverName: text(truck.driverName) || "—",
      pickupCompany: pumpName.get(String(truck.pumpId)) || "—",
      fuelType: o.fuelType === "diesel" ? "diesel" : "petrol",
      quantityLitres: Number(o.quantityLitres) || 0,
      stage,
      arrivedAt: o.arrivedAt instanceof Date ? o.arrivedAt.toISOString() : "",
      expectedArrival: o.expectedArrival instanceof Date ? o.expectedArrival.toISOString() : "",
    });
  }
  return rows;
}
