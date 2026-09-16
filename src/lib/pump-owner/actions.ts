"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getStoredPumps } from "@/lib/pump-owner/storage";
import type { PumpOwnerSession } from "@/lib/pump-owner/types";

const PUMP_OWNER_COOKIE_NAME = "pump_owner_session";
const PUMP_OWNER_ACCOUNTS_COOKIE = "pump_owner_accounts";

interface PumpOwnerAccountRecord {
  email: string;
  pumpId: string;
  createdAt: string;
}

async function getPumpOwnerAccounts(): Promise<PumpOwnerAccountRecord[]> {
  try {
    const cookieStore = await cookies();
    const accountsCookie = cookieStore.get(PUMP_OWNER_ACCOUNTS_COOKIE)?.value;
    if (accountsCookie) {
      return JSON.parse(accountsCookie) as PumpOwnerAccountRecord[];
    }
  } catch {
    // If cookie is invalid, return empty array
  }
  return [];
}

async function savePumpOwnerAccount(email: string, pumpId: string): Promise<void> {
  const accounts = await getPumpOwnerAccounts();
  const exists = accounts.some(a => a.email === email && a.pumpId === pumpId);

  if (!exists) {
    accounts.push({
      email,
      pumpId,
      createdAt: new Date().toISOString(),
    });

    const cookieStore = await cookies();
    cookieStore.set(PUMP_OWNER_ACCOUNTS_COOKIE, JSON.stringify(accounts), {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }
}

export async function pumpOwnerLogin(
  email: string,
  pumpId: string
): Promise<{ success: boolean; error?: string }> {
  const pumps = await getStoredPumps();
  const pumpWithId = pumps.find(p => p.pumpId === pumpId);

  // Check if pump exists
  if (!pumpWithId) {
    return {
      success: false,
      error: "Invalid pump ID. Please contact admin for your pump ID.",
    };
  }

  // Check if email matches pump's assigned email
  if (pumpWithId.ownerEmail !== email) {
    return {
      success: false,
      error: "This email is not authorized for pump owner signup. Please contact admin.",
    };
  }

  // Check approval status
  if (pumpWithId.approvalStatus === "pending") {
    return {
      success: false,
      error: "Your account is pending admin approval. Please wait for approval to be able to log in.",
    };
  }

  if (pumpWithId.approvalStatus === "rejected") {
    return {
      success: false,
      error: "Your account signup was rejected. Please contact the administrator.",
    };
  }

  // Check if this email has been used for another pump
  const accounts = await getPumpOwnerAccounts();
  const existingAccount = accounts.find(a => a.email === email && a.pumpId !== pumpId);
  if (existingAccount) {
    return {
      success: false,
      error: "This email is already linked to another pump. Each email can only be used for one pump.",
    };
  }

  if (pumpWithId.status === "disabled") {
    return {
      success: false,
      error: "This pump account has been disabled by the administrator.",
    };
  }

  const cookieStore = await cookies();
  cookieStore.set(PUMP_OWNER_COOKIE_NAME, JSON.stringify({
    pumpId: pumpWithId.pumpId,
    pumpName: pumpWithId.pumpName,
    ownerName: pumpWithId.ownerName,
    ownerEmail: pumpWithId.ownerEmail,
    status: pumpWithId.status,
  } as PumpOwnerSession), {
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  // Track this pump owner account
  await savePumpOwnerAccount(email, pumpWithId.pumpId);

  return { success: true };
}

export async function getPumpOwnerSession(): Promise<PumpOwnerSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(PUMP_OWNER_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    return JSON.parse(sessionCookie) as PumpOwnerSession;
  } catch {
    return null;
  }
}

export async function requirePumpOwnerAuth(): Promise<PumpOwnerSession> {
  const session = await getPumpOwnerSession();
  if (!session) {
    redirect("/pump-owner/login");
  }
  return session;
}

export async function pumpOwnerLogout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(PUMP_OWNER_COOKIE_NAME);
  redirect("/pump-owner/login");
}
