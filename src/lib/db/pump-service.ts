"use server";

import { getDatabase } from "./mongodb";
import type { PumpRecord } from "./models";
import { ObjectId } from "mongodb";

const COLLECTION_NAME = "pumps";

export async function createPump(
  pump: Omit<PumpRecord, "_id" | "createdAt" | "updatedAt" | "createdBy">,
  adminId: string
): Promise<PumpRecord> {
  // Deliberately does NOT swallow errors into a null return: the caller
  // (admin/pumps POST) needs the real MongoDB error message (bad
  // ObjectId, connection failure, validator rejection, etc.) to surface
  // it in the API response instead of a generic, undiagnosable failure.
  const db = await getDatabase();
  const collection = db.collection<PumpRecord>(COLLECTION_NAME);

  const pumpData: PumpRecord = {
    ...pump,
    createdBy: new ObjectId(adminId),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await collection.insertOne(pumpData);
  return { ...pumpData, _id: result.insertedId };
}

export async function getPumpById(id: string): Promise<PumpRecord | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<PumpRecord>(COLLECTION_NAME);
    return await collection.findOne({ _id: new ObjectId(id) });
  } catch (error) {
    console.error("[PumpService] Get error:", error);
    return null;
  }
}

export async function getPumpByEmail(email: string): Promise<PumpRecord | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<PumpRecord>(COLLECTION_NAME);
    return await collection.findOne({ ownerEmail: email.toLowerCase() });
  } catch (error) {
    console.error("[PumpService] Get by email error:", error);
    return null;
  }
}

export async function getAllPumps(): Promise<PumpRecord[]> {
  try {
    const db = await getDatabase();
    const collection = db.collection<PumpRecord>(COLLECTION_NAME);
    return await collection.find({}).toArray();
  } catch (error) {
    console.error("[PumpService] Get all error:", error);
    return [];
  }
}

export async function updatePump(
  id: string,
  updates: Partial<Omit<PumpRecord, "_id" | "createdAt" | "createdBy">>
): Promise<PumpRecord | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<PumpRecord>(COLLECTION_NAME);

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    return result || null;
  } catch (error) {
    console.error("[PumpService] Update error:", error);
    return null;
  }
}

export async function deletePump(id: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    const collection = db.collection<PumpRecord>(COLLECTION_NAME);
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  } catch (error) {
    console.error("[PumpService] Delete error:", error);
    return false;
  }
}

export async function updatePumpStatus(
  id: string,
  status: "Online" | "Offline" | "Maintenance"
): Promise<boolean> {
  try {
    const db = await getDatabase();
    const collection = db.collection<PumpRecord>(COLLECTION_NAME);
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error("[PumpService] Update status error:", error);
    return false;
  }
}
