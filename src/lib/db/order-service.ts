"use server";

import { getDatabase } from "./mongodb";
import type { FuelOrder } from "./models";
import { ObjectId } from "mongodb";
import { releaseTrucksForOrder } from "@/lib/truck/service";

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

// One order by its id. Used by the admin assignment routes.
export async function getOrderById(id: string): Promise<FuelOrder | null> {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDatabase();
  return db.collection<FuelOrder>(COLLECTION_NAME).findOne({ _id: new ObjectId(id) });
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
    // A completed order frees its truck.
    if (result && status === "completed") await releaseTrucksForOrder(result._id as ObjectId);
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
    // If the pump owner had already confirmed, the driver confirmation completes the order.
    if (result && result.pumpOwnerConfirmedAt) {
      const completed = await collection.findOneAndUpdate({ _id: result._id }, { $set: { status: "completed", updatedAt: new Date() } }, { returnDocument: "after" });
      if (completed) await releaseTrucksForOrder(completed._id as ObjectId);
      return completed || null;
    }
    return result || null;
  } catch (error) {
    console.error("[OrderService] confirmDeliveryByDriver error:", error);
    return null;
  }
}
