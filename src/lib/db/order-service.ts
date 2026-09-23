"use server";

import { getDatabase } from "./mongodb";
import type { FuelOrder } from "./models";
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
    const db = await getDatabase();
    const collection = db.collection<FuelOrder>(COLLECTION_NAME);
    return await collection
      .find({ pumpId: new ObjectId(pumpId) })
      .sort({ requestedAt: -1 })
      .toArray();
  } catch (error) {
    console.error("[OrderService] getOrdersByPump error:", error);
    return [];
  }
}

export async function updateOrderStatus(
  id: string,
  status: "pending" | "accepted" | "dispatched" | "delivered" | "payment-pending" | "paid" | "cleared"
): Promise<FuelOrder | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<FuelOrder>(COLLECTION_NAME);

    const timestampField: Record<string, unknown> = {};
    if (status === "accepted") timestampField.acceptedAt = new Date();
    if (status === "dispatched") timestampField.dispatchedAt = new Date();
    if (status === "delivered") timestampField.deliveredAt = new Date();

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status, ...timestampField, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
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
