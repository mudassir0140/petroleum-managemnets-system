"use server";

import { getDatabase } from "./mongodb";
import { User } from "./models";

const COLLECTION_NAME = "users";

export async function createUser(user: Omit<User, "_id">): Promise<User> {
  const db = await getDatabase();
  const collection = db.collection<User>(COLLECTION_NAME);

  const now = new Date();
  const newUser: User = {
    ...user,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(newUser);
  return { ...newUser, _id: result.insertedId };
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = await getDatabase();
  const collection = db.collection<User>(COLLECTION_NAME);
  return collection.findOne({ email: { $regex: `^${email}$`, $options: "i" } });
}

export async function getUserById(id: string): Promise<User | null> {
  const db = await getDatabase();
  const collection = db.collection<User>(COLLECTION_NAME);
  try {
    const { ObjectId } = await import("mongodb");
    return collection.findOne({ _id: new ObjectId(id) });
  } catch {
    return null;
  }
}

export async function getAllUsers(): Promise<User[]> {
  const db = await getDatabase();
  const collection = db.collection<User>(COLLECTION_NAME);
  return collection.find({}).toArray();
}

export async function updateUser(email: string, updates: Partial<User>): Promise<User | null> {
  const db = await getDatabase();
  const collection = db.collection<User>(COLLECTION_NAME);

  const result = await collection.findOneAndUpdate(
    { email: { $regex: `^${email}$`, $options: "i" } },
    { $set: { ...updates, updatedAt: new Date() } },
    { returnDocument: "after" }
  );

  return (result as any)?.value || null;
}

export async function deleteUser(email: string): Promise<boolean> {
  const db = await getDatabase();
  const collection = db.collection<User>(COLLECTION_NAME);
  const result = await collection.deleteOne({ email: { $regex: `^${email}$`, $options: "i" } });
  return result.deletedCount > 0;
}

export async function userExists(email: string): Promise<boolean> {
  const db = await getDatabase();
  const collection = db.collection<User>(COLLECTION_NAME);
  const user = await collection.findOne({ email: { $regex: `^${email}$`, $options: "i" } });
  return !!user;
}

export async function initializeUserIndexes(): Promise<void> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  await collection.createIndex({ email: 1 }, { unique: true });
  await collection.createIndex({ role: 1 });
  await collection.createIndex({ approvalStatus: 1 });
  console.log("[MongoDB] User indexes initialized");
}
