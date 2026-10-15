"use server";

import crypto from "crypto";
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
): Promise<{ admin: Admin; error?: string } | { admin?: null; error: string }> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Admin>(COLLECTION_NAME);

    // Check if admin already exists
    const existing = await collection.findOne({ email: email.toLowerCase() });
    if (existing) {
      return { admin: null, error: "Email already registered" };
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
    const createdAdmin = { ...admin, _id: result.insertedId };
    return { admin: createdAdmin };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[AdminService] Signup error - Full details:", {
      errorMessage,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      fullError: error,
    });

    // Check for duplicate key error (MongoDB E11000)
    if (error instanceof Error && (error.message.includes("E11000") || error.message.includes("duplicate"))) {
      return { admin: null, error: "Email already registered" };
    }

    return { admin: null, error: `Failed to create account: ${errorMessage}` };
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

// Server-side admin session. The admin cookie carries a random token; only its SHA-256
// hash is kept on the admin record. Ending the session removes the hash, so every copy
// of the cookie stops working at once.
function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function startAdminSession(adminId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const db = await getDatabase();
  await db.collection(COLLECTION_NAME).updateOne(
    { _id: new ObjectId(adminId) },
    { $set: { sessionTokenHash: hashSessionToken(token), sessionStartedAt: new Date() } }
  );
  return token;
}

export async function isAdminSessionValid(adminId: string, token: string): Promise<boolean> {
  if (!token || !ObjectId.isValid(adminId)) return false;
  const db = await getDatabase();
  const admin = await db
    .collection(COLLECTION_NAME)
    .findOne({ _id: new ObjectId(adminId) }, { projection: { sessionTokenHash: 1, status: 1 } });
  if (!admin || admin.status !== "active" || typeof admin.sessionTokenHash !== "string") return false;
  const given = Buffer.from(hashSessionToken(token));
  const stored = Buffer.from(admin.sessionTokenHash);
  return given.length === stored.length && crypto.timingSafeEqual(given, stored);
}

export async function endAdminSession(adminId: string): Promise<void> {
  if (!ObjectId.isValid(adminId)) return;
  const db = await getDatabase();
  await db
    .collection(COLLECTION_NAME)
    .updateOne({ _id: new ObjectId(adminId) }, { $unset: { sessionTokenHash: "", sessionStartedAt: "" } });
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
