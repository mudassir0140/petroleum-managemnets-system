"use server";

import { getDatabase } from "./mongodb";
import type { PumpPayment } from "./models";
import { ObjectId } from "mongodb";

const COLLECTION_NAME = "payments";

export async function createPayment(
  payment: Omit<PumpPayment, "_id" | "amountPaid" | "status" | "paidAt" | "createdBy" | "createdAt" | "updatedAt">,
  adminId: string
): Promise<PumpPayment> {
  const db = await getDatabase();
  const collection = db.collection<PumpPayment>(COLLECTION_NAME);

  const doc: PumpPayment = {
    ...payment,
    amountPaid: 0,
    status: "pending",
    createdBy: new ObjectId(adminId),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await collection.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function getAllPayments(): Promise<PumpPayment[]> {
  try {
    const db = await getDatabase();
    const collection = db.collection<PumpPayment>(COLLECTION_NAME);
    return await collection.find({}).sort({ dueDate: 1 }).toArray();
  } catch (error) {
    console.error("[PaymentService] getAllPayments error:", error);
    return [];
  }
}

export async function getPaymentsByPump(pumpId: string): Promise<PumpPayment[]> {
  try {
    const db = await getDatabase();
    const collection = db.collection<PumpPayment>(COLLECTION_NAME);
    return await collection
      .find({ pumpId: new ObjectId(pumpId) })
      .sort({ dueDate: -1 })
      .toArray();
  } catch (error) {
    console.error("[PaymentService] getPaymentsByPump error:", error);
    return [];
  }
}

export async function markPaymentPaid(id: string, amountPaid: number): Promise<PumpPayment | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<PumpPayment>(COLLECTION_NAME);
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status: "paid", amountPaid, paidAt: new Date(), updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    return result || null;
  } catch (error) {
    console.error("[PaymentService] markPaymentPaid error:", error);
    return null;
  }
}
