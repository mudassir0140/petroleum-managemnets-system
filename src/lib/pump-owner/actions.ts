"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getStoredPumps } from "@/lib/pump-owner/storage";
import { getUserByEmail } from "@/lib/db/users";
import { initializeDatabase } from "@/lib/db/init";
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
  password: string
): Promise<{ success: boolean; error?: string; pumpId?: string }> {
  try {
    await initializeDatabase();

    // First, try to authenticate via MongoDB user (new flow: admin-created accounts)
    const user = await getUserByEmail(email);

    if (user && user.role === "pump-owner") {
      // Check password (in production, should use bcrypt comparison)
      if (user.passwordHash === password) {
        // Check approval status
        if (user.approvalStatus === "pending") {
          return {
            success: false,
            error: "Your account is pending admin approval. Please wait for approval.",
          };
        }

        if (user.approvalStatus === "rejected") {
          return {
            success: false,
            error: "Your account has been rejected. Please contact the administrator.",
          };
        }

        // Account is approved, set session
        if (user.pumpId) {
          const cookieStore = await cookies();
          cookieStore.set(PUMP_OWNER_COOKIE_NAME, JSON.stringify({
            pumpId: user.pumpId,
            pumpName: "", // Will be fetched from pump data if needed
            ownerName: "",
            ownerEmail: email,
            status: "active",
          } as PumpOwnerSession), {
            maxAge: 60 * 60 * 24 * 30, // 30 days
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
          });

          await savePumpOwnerAccount(email, user.pumpId);
          return { success: true, pumpId: user.pumpId };
        }
      } else {
        return {
          success: false,
          error: "Invalid email or password.",
        };
      }
    }

    // Fallback to old flow for backward compatibility
    const pumps = await getStoredPumps();
    const pumpWithEmail = pumps.find(p => p.ownerEmail?.toLowerCase() === email?.toLowerCase());

    if (!pumpWithEmail) {
      return {
        success: false,
        error: "Email not found. Please contact your administrator.",
      };
    }

    // Check approval status
    if (pumpWithEmail.approvalStatus === "pending") {
      return {
        success: false,
        error: "Your account is pending admin approval. Please wait for approval.",
      };
    }

    if (pumpWithEmail.approvalStatus === "rejected") {
      return {
        success: false,
        error: "Your account signup was rejected. Please contact the administrator.",
      };
    }

    if (pumpWithEmail.status === "disabled") {
      return {
        success: false,
        error: "This pump account has been disabled by the administrator.",
      };
    }

    const cookieStore = await cookies();
    cookieStore.set(PUMP_OWNER_COOKIE_NAME, JSON.stringify({
      pumpId: pumpWithEmail.pumpId,
      pumpName: pumpWithEmail.pumpName,
      ownerName: pumpWithEmail.ownerName,
      ownerEmail: pumpWithEmail.ownerEmail,
      status: pumpWithEmail.status,
    } as PumpOwnerSession), {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    await savePumpOwnerAccount(email, pumpWithEmail.pumpId);
    return { success: true, pumpId: pumpWithEmail.pumpId };
  } catch (error) {
    console.error("[Pump Owner Login] Error:", error);
    return {
      success: false,
      error: "An error occurred during login. Please try again.",
    };
  }
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

export async function setPumpOwnerSessionCookie(pumpId: string, email: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(PUMP_OWNER_COOKIE_NAME, JSON.stringify({
    pumpId,
    pumpName: "",
    ownerName: "",
    ownerEmail: email,
    status: "active",
  } as PumpOwnerSession), {
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
}
