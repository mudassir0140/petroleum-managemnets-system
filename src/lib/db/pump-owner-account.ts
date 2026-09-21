"use server";

import { getDatabase } from "./mongodb";
import { verifyPassword } from "@/lib/auth/password";
import type { PumpRecord } from "./models";
import { ObjectId } from "mongodb";

const ACCOUNTS_COLLECTION = "pump_owner_accounts";

export interface PumpOwnerAccount {
  _id?: ObjectId;
  email: string;
  pumpId: ObjectId;
  pumpName: string;
  ownerName: string;
  passwordHash: string;
  role: "pump-owner";
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export async function createPumpOwnerAccount(
  pump: PumpRecord & { ownerPasswordHash: string }
): Promise<PumpOwnerAccount | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<PumpOwnerAccount>(ACCOUNTS_COLLECTION);

    // Check if account already exists
    const existing = await collection.findOne({
      email: pump.ownerEmail.toLowerCase(),
    });
    if (existing) {
      // Update existing account instead of creating duplicate
      const result = await collection.updateOne(
        { _id: existing._id },
        {
          $set: {
            pumpId: pump._id,
            pumpName: pump.name,
            ownerName: pump.ownerName,
            passwordHash: pump.ownerPasswordHash,
            status: "active",
            updatedAt: new Date(),
          },
        }
      );
      return existing;
    }

    const account: PumpOwnerAccount = {
      email: pump.ownerEmail.toLowerCase(),
      pumpId: pump._id!,
      pumpName: pump.name,
      ownerName: pump.ownerName,
      passwordHash: pump.ownerPasswordHash,
      role: "pump-owner",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(account);
    return { ...account, _id: result.insertedId };
  } catch (error) {
    console.error("[PumpOwnerAccount] Create error:", error);
    return null;
  }
}

export async function getPumpOwnerByEmail(
  email: string
): Promise<PumpOwnerAccount | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<PumpOwnerAccount>(ACCOUNTS_COLLECTION);
    return await collection.findOne({ email: email.toLowerCase() });
  } catch (error) {
    console.error("[PumpOwnerAccount] Get by email error:", error);
    return null;
  }
}

export async function authenticatePumpOwner(
  email: string,
  password: string
): Promise<PumpOwnerAccount | null> {
  try {
    const account = await getPumpOwnerByEmail(email);
    if (!account) {
      return null;
    }

    if (account.status !== "active") {
      return null;
    }

    if (!verifyPassword(password, account.passwordHash)) {
      return null;
    }

    // Update last login
    const db = await getDatabase();
    const collection = db.collection<PumpOwnerAccount>(ACCOUNTS_COLLECTION);
    await collection.updateOne(
      { _id: account._id },
      { $set: { lastLogin: new Date() } }
    );

    return account;
  } catch (error) {
    console.error("[PumpOwnerAccount] Auth error:", error);
    return null;
  }
}

export async function updatePumpOwnerStatus(
  id: string,
  status: "active" | "inactive"
): Promise<boolean> {
  try {
    const db = await getDatabase();
    const collection = db.collection<PumpOwnerAccount>(ACCOUNTS_COLLECTION);
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error("[PumpOwnerAccount] Update status error:", error);
    return false;
  }
}
