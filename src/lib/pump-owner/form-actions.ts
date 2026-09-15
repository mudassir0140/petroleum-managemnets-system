"use server";

import { savePump, generatePumpId } from "@/lib/pump-owner/storage";
import type { PumpOwnerAccount } from "@/lib/pump-owner/types";

export async function savePumpAction(pump: PumpOwnerAccount): Promise<void> {
  await savePump(pump);
}

export async function generatePumpIdAction(): Promise<string> {
  return generatePumpId();
}
