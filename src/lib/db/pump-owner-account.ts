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
    const emailLower = pump.ownerEmail.toLowerCase();
    console.log("[CreatePumpOwnerAccount] Creating account for pump:", {
      pumpName: pump.name,
      email: emailLower,
      ownerName: pump.ownerName,
      hasPasswordHash: !!pump.ownerPasswordHash,
      passwordHashLength: pump.ownerPasswordHash?.length,
    });

    const db = await getDatabase();
    const collection = db.collection(ACCOUNTS_COLLECTION);

    // Check if account already exists
    const existing = await collection.findOne({
      email: emailLower,
    });

    if (existing) {
      console.log("[CreatePumpOwnerAccount] Account already exists, updating:", existing._id);
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
      console.log("[CreatePumpOwnerAccount] Update result:", {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount,
      });
      return existing;
    }

    const account: PumpOwnerAccount = {
      email: emailLower,
      pumpId: pump._id!,
      pumpName: pump.name,
      ownerName: pump.ownerName,
      passwordHash: pump.ownerPasswordHash,
      role: "pump-owner",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log("[CreatePumpOwnerAccount] Inserting new account");
    const result = await collection.insertOne(account);
    console.log("[CreatePumpOwnerAccount] Insert successful:", {
      insertedId: result.insertedId,
      email: account.email,
      status: account.status,
    });

    return { ...account, _id: result.insertedId };
  } catch (error) {
    console.error("[CreatePumpOwnerAccount] Error:", error);
    return null;
  }
}

export async function getPumpOwnerByEmail(
  email: string
): Promise<PumpOwnerAccount | null> {
  try {
    const emailLower = email.toLowerCase();
    console.log("[GetPumpOwnerByEmail] Searching for email:", emailLower);

    const db = await getDatabase();
    const collection = db.collection(ACCOUNTS_COLLECTION);
    const account = await collection.findOne({ email: emailLower });

    console.log("[GetPumpOwnerByEmail] Query result:", {
      found: !!account,
      email: account?.email,
      pumpName: account?.pumpName,
      status: account?.status,
      role: account?.role,
    });

    return account;
  } catch (error) {
    console.error("[GetPumpOwnerByEmail] Error:", error);
    return null;
  }
}

export async function authenticatePumpOwner(
  email: string,
  password: string
): Promise<PumpOwnerAccount | null> {
  try {
    const emailLower = email.toLowerCase();
    console.log("[AuthPumpOwner] Starting authentication for email:", emailLower);

    const account = await getPumpOwnerByEmail(email);
    console.log("[AuthPumpOwner] Account lookup result:", {
      found: !!account,
      accountEmail: account?.email,
      hasPasswordHash: !!account?.passwordHash,
      passwordHashLength: account?.passwordHash?.length,
    });

    if (!account) {
      console.log("[AuthPumpOwner] FAIL: Account not found for email:", emailLower);
      return null;
    }

    if (account.status !== "active") {
      console.log("[AuthPumpOwner] FAIL: Account status is not active, status:", account.status);
      return null;
    }

    const isPasswordValid = verifyPassword(password, account.passwordHash);
    console.log("[AuthPumpOwner] Password verification result:", {
      isValid: isPasswordValid,
      storedHashLength: account.passwordHash.length,
      passwordLength: password.length,
    });

    if (!isPasswordValid) {
      console.log("[AuthPumpOwner] FAIL: Password verification failed");
      return null;
    }

    console.log("[AuthPumpOwner] SUCCESS: Authentication passed, updating lastLogin");

    // Update last login
    const db = await getDatabase();
    const collection = db.collection(ACCOUNTS_COLLECTION);
    await collection.updateOne(
      { _id: account._id },
      { $set: { lastLogin: new Date() } }
    );

    return account;
  } catch (error) {
    console.error("[AuthPumpOwner] Caught error:", error);
    return null;
  }
}

export async function updatePumpOwnerStatus(
  id: string,
  status: "active" | "inactive"
): Promise<boolean> {
  try {
    const db = await getDatabase();
    const collection = db.collection(ACCOUNTS_COLLECTION);
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
