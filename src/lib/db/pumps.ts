"use server";

import { getDatabase } from "./mongodb";
import { Pump } from "./models";
import { ObjectId } from "mongodb";

const COLLECTION_NAME = "pumps";

export async function createPump(pump: Omit<Pump, "_id">): Promise<Pump> {
  const db = await getDatabase();
  const collection = db.collection<Pump>(COLLECTION_NAME);

  const now = new Date();
  const newPump: Pump = {
    ...pump,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(newPump);
  return { ...newPump, _id: result.insertedId };
}

export async function getPumpByEmail(email: string): Promise<Pump | null> {
  const db = await getDatabase();
  const collection = db.collection<Pump>(COLLECTION_NAME);
  return collection.findOne({ ownerEmail: { $regex: `^${email}$`, $options: "i" } });
}

export async function getPumpById(pumpId: string): Promise<Pump | null> {
  const db = await getDatabase();
  const collection = db.collection<Pump>(COLLECTION_NAME);
  return collection.findOne({ pumpId });
}

export async function getAllPumps(): Promise<Pump[]> {
  const db = await getDatabase();
  const collection = db.collection<Pump>(COLLECTION_NAME);
  return collection.find({}).toArray();
}

export async function updatePump(pumpId: string, updates: Partial<Pump>): Promise<Pump | null> {
  const db = await getDatabase();
  const collection = db.collection<Pump>(COLLECTION_NAME);

  const result = await collection.findOneAndUpdate(
    { pumpId },
    { $set: { ...updates, updatedAt: new Date() } },
    { returnDocument: "after" }
  );

  return (result as any)?.value || null;
}

export async function deletePump(pumpId: string): Promise<boolean> {
  const db = await getDatabase();
  const collection = db.collection<Pump>(COLLECTION_NAME);
  const result = await collection.deleteOne({ pumpId });
  return result.deletedCount > 0;
}

export async function generatePumpId(): Promise<string> {
  return `PUMP-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}

export async function initializePumpIndexes(): Promise<void> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  await collection.createIndex({ pumpId: 1 }, { unique: true });
  await collection.createIndex({ ownerEmail: 1 });
  console.log("[MongoDB] Pump indexes initialized");
}
