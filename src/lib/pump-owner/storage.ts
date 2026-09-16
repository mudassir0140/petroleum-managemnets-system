"use server";

import { cookies } from "next/headers";
import type { PumpOwnerAccount } from "@/lib/pump-owner/types";

const PUMPS_STORAGE_COOKIE = "petromanage_pumps_store";

export async function getStoredPumps(): Promise<PumpOwnerAccount[]> {
  try {
    const cookieStore = await cookies();
    const pumpsCookie = cookieStore.get(PUMPS_STORAGE_COOKIE)?.value;
    if (pumpsCookie) {
      const pumps = JSON.parse(pumpsCookie) as PumpOwnerAccount[];
      console.log("[Pump Storage] Retrieved", pumps.length, 'pumps from cookie. First 3 emails:', pumps.slice(0, 3).map(p => p.ownerEmail));
      return pumps;
    } else {
      console.log("[Pump Storage] No pumps cookie found");
    }
  } catch (error) {
    console.error("[Pump Storage] Error parsing pumps cookie:", error);
  }
  return [];
}

export async function savePump(pump: PumpOwnerAccount): Promise<void> {
  const pumps = await getStoredPumps();
  const index = pumps.findIndex(p => p.pumpId === pump.pumpId);

  if (index >= 0) {
    pumps[index] = pump;
  } else {
    pumps.push(pump);
  }

  const cookieStore = await cookies();
  cookieStore.set(PUMPS_STORAGE_COOKIE, JSON.stringify(pumps), {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
}

export async function deletePump(pumpId: string): Promise<void> {
  const pumps = await getStoredPumps();
  const filtered = pumps.filter(p => p.pumpId !== pumpId);

  const cookieStore = await cookies();
  cookieStore.set(PUMPS_STORAGE_COOKIE, JSON.stringify(filtered), {
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
}

export async function generatePumpId(): Promise<string> {
  return `PUMP-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}
