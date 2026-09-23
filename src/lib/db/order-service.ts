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
  status: "pending" | "dispatched" | "delivered"
): Promise<FuelOrder | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<FuelOrder>(COLLECTION_NAME);

    const timestampField =
      status === "dispatched" ? { dispatchedAt: new Date() } :
      status === "delivered" ? { deliveredAt: new Date() } :
      {};

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
