"use server";

import { getDatabase } from "./mongodb";
import type { PaymentProof } from "./models";
import { ObjectId } from "mongodb";

const COLLECTION_NAME = "payment_proofs";

export async function createPaymentProof(
  proof: Omit<PaymentProof, "_id" | "status" | "createdAt" | "updatedAt">
): Promise<PaymentProof> {
  const db = await getDatabase();
  const collection = db.collection<PaymentProof>(COLLECTION_NAME);

  const doc: PaymentProof = {
    ...proof,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await collection.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function getPaymentProofById(id: string): Promise<PaymentProof | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<PaymentProof>(COLLECTION_NAME);
    return await collection.findOne({ _id: new ObjectId(id) });
  } catch (error) {
    console.error("[PaymentProofService] Get error:", error);
    return null;
  }
}

export async function getPaymentProofsByOrder(orderId: string): Promise<PaymentProof[]> {
  try {
    const db = await getDatabase();
    const collection = db.collection<PaymentProof>(COLLECTION_NAME);
    return await collection
      .find({ orderId: new ObjectId(orderId) })
      .sort({ uploadedAt: -1 })
      .toArray();
  } catch (error) {
    console.error("[PaymentProofService] getPaymentProofsByOrder error:", error);
    return [];
  }
}

export async function getPaymentProofsByPump(pumpId: string): Promise<PaymentProof[]> {
  try {
    const db = await getDatabase();
    const collection = db.collection<PaymentProof>(COLLECTION_NAME);
    return await collection
      .find({ pumpId: new ObjectId(pumpId) })
      .sort({ uploadedAt: -1 })
      .toArray();
  } catch (error) {
    console.error("[PaymentProofService] getPaymentProofsByPump error:", error);
    return [];
  }
}

export async function approvePaymentProof(
  id: string,
  adminId: string
): Promise<PaymentProof | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<PaymentProof>(COLLECTION_NAME);

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "approved",
          approvedBy: new ObjectId(adminId),
          approvedAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    return result || null;
  } catch (error) {
    console.error("[PaymentProofService] approvePaymentProof error:", error);
    return null;
  }
}

export async function rejectPaymentProof(
  id: string,
  adminId: string,
  reason: string
): Promise<PaymentProof | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<PaymentProof>(COLLECTION_NAME);

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "rejected",
          rejectionReason: reason,
          approvedBy: new ObjectId(adminId),
          approvedAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    return result || null;
  } catch (error) {
    console.error("[PaymentProofService] rejectPaymentProof error:", error);
    return null;
  }
}
