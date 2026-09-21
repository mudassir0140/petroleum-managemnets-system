"use server";

import { readJSON, writeJSON } from "./file-storage";
import type { Pump } from "./models";

const FILENAME = "pumps.json";

export async function createPump(pump: Omit<Pump, "_id">): Promise<Pump> {
  const pumps = await getAllPumps();
  const now = new Date().toISOString();

  const newPump: Pump = {
    ...pump,
    createdAt: typeof pump.createdAt === "string" ? pump.createdAt : now,
    updatedAt: typeof pump.updatedAt === "string" ? pump.updatedAt : now,
  };

  pumps.push(newPump);
  await writeJSON(FILENAME, pumps);
  return newPump;
}

export async function getPumpByEmail(email: string): Promise<Pump | null> {
  const pumps = await getAllPumps();
  return pumps.find((p) => p.ownerEmail.toLowerCase() === email.toLowerCase()) || null;
}

export async function getPumpById(pumpId: string): Promise<Pump | null> {
  const pumps = await getAllPumps();
  return pumps.find((p) => p.pumpId === pumpId) || null;
}

export async function getAllPumps(): Promise<Pump[]> {
  return readJSON<Pump>(FILENAME);
}

export async function updatePump(pumpId: string, updates: Partial<Pump>): Promise<Pump | null> {
  const pumps = await getAllPumps();
  const index = pumps.findIndex((p) => p.pumpId === pumpId);

  if (index === -1) return null;

  const updated: Pump = {
    ...pumps[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  pumps[index] = updated;
  await writeJSON(FILENAME, pumps);
  return updated;
}

export async function deletePump(pumpId: string): Promise<boolean> {
  const pumps = await getAllPumps();
  const index = pumps.findIndex((p) => p.pumpId === pumpId);

  if (index === -1) return false;

  pumps.splice(index, 1);
  await writeJSON(FILENAME, pumps);
  return true;
}

export async function generatePumpId(): Promise<string> {
  const pumps = await getAllPumps();
  const lastId = pumps.length > 0
    ? parseInt(pumps[pumps.length - 1].pumpId.split("-")[1] || "0")
    : 0;
  return `PUMP-${(lastId + 1).toString().padStart(6, "0")}`;
}

export async function initializePumpIndexes(): Promise<void> {
  console.log("[FileStorage] Pump file initialized");
}
