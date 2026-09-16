"use server";

import { getDatabase } from "./mongodb";
import { Employee } from "./models";
import { ObjectId } from "mongodb";

const COLLECTION_NAME = "employees";

export async function createEmployee(employee: Omit<Employee, "_id">): Promise<Employee> {
  const db = await getDatabase();
  const collection = db.collection<Employee>(COLLECTION_NAME);

  const now = new Date();
  const newEmployee: Employee = {
    ...employee,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(newEmployee);
  return { ...newEmployee, _id: result.insertedId };
}

export async function getEmployeeByEmail(email: string, role?: string): Promise<Employee | null> {
  const db = await getDatabase();
  const collection = db.collection<Employee>(COLLECTION_NAME);

  const query: any = { email: { $regex: `^${email}$`, $options: "i" } };
  if (role) {
    query.role = role;
  }

  return collection.findOne(query);
}

export async function getEmployeeById(employeeId: string): Promise<Employee | null> {
  const db = await getDatabase();
  const collection = db.collection<Employee>(COLLECTION_NAME);
  return collection.findOne({ employeeId });
}

export async function getEmployeesByRole(role: string): Promise<Employee[]> {
  const db = await getDatabase();
  const collection = db.collection<Employee>(COLLECTION_NAME);
  return collection.find({ role }).toArray();
}

export async function getAllEmployees(): Promise<Employee[]> {
  const db = await getDatabase();
  const collection = db.collection<Employee>(COLLECTION_NAME);
  return collection.find({}).toArray();
}

export async function updateEmployee(employeeId: string, updates: Partial<Employee>): Promise<Employee | null> {
  const db = await getDatabase();
  const collection = db.collection<Employee>(COLLECTION_NAME);

  const result = await collection.findOneAndUpdate(
    { employeeId },
    { $set: { ...updates, updatedAt: new Date() } },
    { returnDocument: "after" }
  );

  return (result as any)?.value || null;
}

export async function deleteEmployee(employeeId: string): Promise<boolean> {
  const db = await getDatabase();
  const collection = db.collection<Employee>(COLLECTION_NAME);
  const result = await collection.deleteOne({ employeeId });
  return result.deletedCount > 0;
}

export async function generateEmployeeId(): Promise<string> {
  return `EMP-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}

export async function initializeEmployeeIndexes(): Promise<void> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  await collection.createIndex({ employeeId: 1 }, { unique: true });
  await collection.createIndex({ email: 1 });
  await collection.createIndex({ role: 1 });
  console.log("[MongoDB] Employee indexes initialized");
}
