"use server";

import { getDatabase } from "./mongodb";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import type { EmployeeRecord } from "./models";
import type { RoleSlug } from "@/lib/roles";
import { ObjectId } from "mongodb";

const COLLECTION_NAME = "employees";

export async function createEmployee(
  employee: Omit<EmployeeRecord, "_id" | "createdAt" | "updatedAt" | "createdBy">,
  adminId: string
): Promise<EmployeeRecord | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<EmployeeRecord>(COLLECTION_NAME);

    // Check if employee already exists
    const existing = await collection.findOne({
      email: employee.email.toLowerCase(),
    });
    if (existing) {
      throw new Error("Employee with this email already exists");
    }

    const employeeData: EmployeeRecord = {
      ...employee,
      email: employee.email.toLowerCase(),
      createdBy: new ObjectId(adminId),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(employeeData);
    return { ...employeeData, _id: result.insertedId };
  } catch (error) {
    console.error("[EmployeeService] Create error:", error);
    return null;
  }
}

export async function getEmployeeById(id: string): Promise<EmployeeRecord | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<EmployeeRecord>(COLLECTION_NAME);
    return await collection.findOne({ _id: new ObjectId(id) });
  } catch (error) {
    console.error("[EmployeeService] Get error:", error);
    return null;
  }
}

export async function getEmployeeByEmail(
  email: string
): Promise<EmployeeRecord | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<EmployeeRecord>(COLLECTION_NAME);
    return await collection.findOne({ email: email.toLowerCase() });
  } catch (error) {
    console.error("[EmployeeService] Get by email error:", error);
    return null;
  }
}

export async function getAllEmployees(): Promise<EmployeeRecord[]> {
  try {
    const db = await getDatabase();
    const collection = db.collection<EmployeeRecord>(COLLECTION_NAME);
    return await collection.find({}).toArray();
  } catch (error) {
    console.error("[EmployeeService] Get all error:", error);
    return [];
  }
}

export async function getEmployeesByRole(
  role: RoleSlug
): Promise<EmployeeRecord[]> {
  try {
    const db = await getDatabase();
    const collection = db.collection<EmployeeRecord>(COLLECTION_NAME);
    return await collection.find({ role }).toArray();
  } catch (error) {
    console.error("[EmployeeService] Get by role error:", error);
    return [];
  }
}

export async function getEmployeesByPump(
  pumpId: string
): Promise<EmployeeRecord[]> {
  try {
    const db = await getDatabase();
    const collection = db.collection<EmployeeRecord>(COLLECTION_NAME);
    return await collection
      .find({ pumpId: new ObjectId(pumpId) })
      .toArray();
  } catch (error) {
    console.error("[EmployeeService] Get by pump error:", error);
    return [];
  }
}

export async function updateEmployee(
  id: string,
  updates: Partial<Omit<EmployeeRecord, "_id" | "createdAt" | "createdBy">>
): Promise<EmployeeRecord | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<EmployeeRecord>(COLLECTION_NAME);

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    return result || null;
  } catch (error) {
    console.error("[EmployeeService] Update error:", error);
    return null;
  }
}

export async function updateEmployeeStatus(
  id: string,
  status: "active" | "inactive"
): Promise<boolean> {
  try {
    const db = await getDatabase();
    const collection = db.collection<EmployeeRecord>(COLLECTION_NAME);
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error("[EmployeeService] Update status error:", error);
    return false;
  }
}

export async function employeeLogin(
  email: string,
  password: string
): Promise<EmployeeRecord | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<EmployeeRecord>(COLLECTION_NAME);

    const employee = await collection.findOne({ email: email.toLowerCase() });
    if (!employee) {
      return null;
    }

    if (employee.status !== "active") {
      return null;
    }

    if (!verifyPassword(password, employee.passwordHash)) {
      return null;
    }

    // Update last login
    await collection.updateOne(
      { _id: employee._id },
      { $set: { lastLogin: new Date() } }
    );

    return employee;
  } catch (error) {
    console.error("[EmployeeService] Login error:", error);
    return null;
  }
}

export async function deleteEmployee(id: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    const collection = db.collection<EmployeeRecord>(COLLECTION_NAME);
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  } catch (error) {
    console.error("[EmployeeService] Delete error:", error);
    return false;
  }
}
