"use server";

import { getDatabase } from "./mongodb";
import type { FuelOrder, Truck } from "./models";
import { ObjectId } from "mongodb";

const COLLECTION_NAME = "orders";

export async function createOrder(
  order: Omit<FuelOrder, "_id" | "status" | "requestedAt" | "requestedBy" | "createdAt" | "updatedAt">,
  adminId: string
): Promise<FuelOrder> {
  const db = await getDatabase();
  const collection = db.collection<FuelOrder>(COLLECTION_NAME);

  const doc: FuelOrder = {
    ...order,
    requestedBy: new ObjectId(adminId),
    status: "pending",
    requestedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await collection.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function getAllOrders(): Promise<FuelOrder[]> {
  try {
    const db = await getDatabase();
    const collection = db.collection<FuelOrder>(COLLECTION_NAME);
    return await collection.find({}).sort({ requestedAt: -1 }).toArray();
  } catch (error) {
    console.error("[OrderService] getAllOrders error:", error);
    return [];
  }
}

export async function getOrdersByPump(pumpId: string): Promise<FuelOrder[]> {
  try {
    console.log("[OrderService] getOrdersByPump called with pumpId:", pumpId);
    const db = await getDatabase();
    const collection = db.collection<FuelOrder>(COLLECTION_NAME);
    const results = await collection
      .find({ pumpId: new ObjectId(pumpId) })
      .sort({ requestedAt: -1 })
      .toArray();
    console.log("[OrderService] getOrdersByPump returned", results.length, "orders");
    return results;
  } catch (error) {
    console.error("[OrderService] getOrdersByPump error:", error);
    throw error; // Rethrow so caller can handle it
  }
}

// Order statuses in which the assigned truck is out on the road.
const TRUCK_BUSY_ORDER_STATUSES: FuelOrder["status"][] = ["accepted", "dispatched", "on-the-way", "delivered"];
// Order statuses in which the assigned truck is released.
const TRUCK_FREE_ORDER_STATUSES: FuelOrder["status"][] = ["completed", "cancelled"];

// Keeps a truck's status in step with the order it carries. A truck is busy
// while its order is accepted, dispatched, on the way or delivered, and free
// again once the order is completed or cancelled. Only the truck that is
// currently bound to this order is changed, so a later order is never touched.
export async function syncTruckWithOrder(order: FuelOrder): Promise<void> {
  if (!order._id || !order.truckId) return;

  const db = await getDatabase();
  const trucks = db.collection<Truck>("trucks");
  const now = new Date();

  if (TRUCK_FREE_ORDER_STATUSES.includes(order.status)) {
    await trucks.updateOne(
      { _id: order.truckId, currentOrderId: order._id },
      {
        $set: { status: "available", updatedAt: now },
        $unset: { currentOrderId: "", currentPumpId: "" },
      }
    );
    return;
  }

  if (TRUCK_BUSY_ORDER_STATUSES.includes(order.status)) {
    await trucks.updateOne(
      { _id: order.truckId, currentOrderId: order._id },
      { $set: { status: "in-transit", updatedAt: now } }
    );
  }
}

export async function updateOrderStatus(
  id: string,
  status: "pending" | "accepted" | "on-the-way" | "dispatched" | "delivered" | "completed" | "payment-pending" | "paid" | "cleared" | "cancelled"
): Promise<FuelOrder | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<FuelOrder>(COLLECTION_NAME);

    const timestampField: Record<string, unknown> = {};
    if (status === "accepted") timestampField.acceptedAt = new Date();
    if (status === "dispatched") timestampField.dispatchedAt = new Date();
    if (status === "on-the-way") timestampField.dispatchedAt = new Date();
    if (status === "delivered") timestampField.deliveredAt = new Date();

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status, ...timestampField, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    if (result) await syncTruckWithOrder(result);
    return result || null;
  } catch (error) {
    console.error("[OrderService] updateOrderStatus error:", error);
    return null;
  }
}

export async function updateOrderWithDriver(
  id: string,
  driverId: string,
  driverName: string,
  trackingNumber: string,
  expectedArrival: Date
): Promise<FuelOrder | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<FuelOrder>(COLLECTION_NAME);

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          driverId: new ObjectId(driverId),
          driverName,
          trackingNumber,
          expectedArrival,
          status: "dispatched",
          dispatchedAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );
    return result || null;
  } catch (error) {
    console.error("[OrderService] updateOrderWithDriver error:", error);
    return null;
  }
}

export async function updateOrderWithInvoice(
  id: string,
  invoiceId: string,
  totalAmount: number
): Promise<FuelOrder | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<FuelOrder>(COLLECTION_NAME);

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          invoiceId: new ObjectId(invoiceId),
          totalAmount,
          status: "payment-pending",
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );
    return result || null;
  } catch (error) {
    console.error("[OrderService] updateOrderWithInvoice error:", error);
    return null;
  }
}

export async function getOrdersByDriver(driverId: string): Promise<FuelOrder[]> {
  try {
    const db = await getDatabase();
    const collection = db.collection<FuelOrder>(COLLECTION_NAME);
    return await collection
      .find({ driverId: new ObjectId(driverId) })
      .sort({ expectedArrival: 1 })
      .toArray();
  } catch (error) {
    console.error("[OrderService] getOrdersByDriver error:", error);
    return [];
  }
}

export async function confirmDeliveryByDriver(id: string): Promise<FuelOrder | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<FuelOrder>(COLLECTION_NAME);

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { driverConfirmedAt: new Date(), updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    return result || null;
  } catch (error) {
    console.error("[OrderService] confirmDeliveryByDriver error:", error);
    return null;
  }
}

export async function confirmDeliveryByPumpOwner(id: string): Promise<FuelOrder | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<FuelOrder>(COLLECTION_NAME);

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { pumpOwnerConfirmedAt: new Date(), updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    // If both driver and pump owner have confirmed, mark as completed
    if (result && result.driverConfirmedAt && result.pumpOwnerConfirmedAt) {
      const completedResult = await collection.findOneAndUpdate(
        { _id: result._id },
        { $set: { status: "completed", updatedAt: new Date() } },
        { returnDocument: "after" }
      );
      if (completedResult) await syncTruckWithOrder(completedResult);
      return completedResult || null;
    }

    return result || null;
  } catch (error) {
    console.error("[OrderService] confirmDeliveryByPumpOwner error:", error);
    return null;
  }
}
