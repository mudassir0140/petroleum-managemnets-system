"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getStoredPumps } from "@/lib/pump-owner/storage";
import type { PumpOwnerSession } from "@/lib/pump-owner/types";

const PUMP_OWNER_COOKIE_NAME = "pump_owner_session";

export async function pumpOwnerLogin(
  email: string,
  pumpId: string
): Promise<{ success: boolean; error?: string }> {
  const pumps = await getStoredPumps();
  const pump = pumps.find(p => p.pumpId === pumpId && p.ownerEmail === email);

  if (!pump) {
    return {
      success: false,
      error: "Invalid email or pump ID",
    };
  }

  if (pump.status === "disabled") {
    return {
      success: false,
      error: "This pump account has been disabled",
    };
  }

  const cookieStore = await cookies();
  cookieStore.set(PUMP_OWNER_COOKIE_NAME, JSON.stringify({
    pumpId: pump.pumpId,
    pumpName: pump.pumpName,
    ownerName: pump.ownerName,
    ownerEmail: pump.ownerEmail,
    status: pump.status,
  } as PumpOwnerSession), {
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

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
