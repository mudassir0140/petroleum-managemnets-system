"use server";

import { getDatabase } from "./mongodb";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import type { Admin } from "./models";
import { ObjectId } from "mongodb";

const COLLECTION_NAME = "admins";

export async function adminSignup(
  email: string,
  password: string,
  name: string,
  phone?: string
): Promise<Admin | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Admin>(COLLECTION_NAME);

    // Check if admin already exists
    const existing = await collection.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new Error("Admin with this email already exists");
    }

    const hashedPassword = hashPassword(password);
    const now = new Date();

    const admin: Admin = {
      email: email.toLowerCase(),
      passwordHash: hashedPassword,
      name,
      phone,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(admin);
    return { ...admin, _id: result.insertedId };
  } catch (error) {
    console.error("[AdminService] Signup error:", error);
    return null;
  }
}

export async function adminLogin(
  email: string,
  password: string
): Promise<Admin | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Admin>(COLLECTION_NAME);

    const admin = await collection.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return null;
    }

    if (admin.status !== "active") {
      return null;
    }

    if (!verifyPassword(password, admin.passwordHash)) {
      return null;
    }

    // Update last login
    await collection.updateOne(
      { _id: admin._id },
      { $set: { lastLogin: new Date() } }
    );

    return admin;
  } catch (error) {
    console.error("[AdminService] Login error:", error);
    return null;
  }
}

export async function getAdminById(id: string): Promise<Admin | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Admin>(COLLECTION_NAME);
    return await collection.findOne({ _id: new ObjectId(id) });
  } catch (error) {
    console.error("[AdminService] Get error:", error);
    return null;
  }
}

export async function updateAdminStatus(
  id: string,
  status: "active" | "inactive"
): Promise<boolean> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Admin>(COLLECTION_NAME);
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error("[AdminService] Update error:", error);
    return false;
  }
}
