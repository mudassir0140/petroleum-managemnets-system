"use server";

<<<<<<< HEAD
import { readJSON, writeJSON } from "./file-storage";

export interface Pump {
  pumpId: string;
  pumpName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  address: string;
  city: string;
  status: "open" | "low-stock" | "closed" | "disabled";
  petrolStock: number;
  petrolCapacity: number;
  dieselStock: number;
  dieselCapacity: number;
  createdAt: string;
  updatedAt: string;
}

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
=======
import {
  createPump as createPumpInStorage,
  getPumpById as getPumpByIdInStorage,
  getPumpByEmail as getPumpByEmailInStorage,
  getAllPumps as getAllPumpsInStorage,
  updatePump as updatePumpInStorage,
  deletePump as deletePumpInStorage,
  generatePumpId as generatePumpIdInStorage,
} from "@/lib/storage/pumps-storage";
import type { Pump } from "./models";

export async function createPump(pump: Omit<Pump, "_id">): Promise<Pump> {
  return createPumpInStorage(pump);
}

export async function getPumpByEmail(email: string): Promise<Pump | null> {
  return getPumpByEmailInStorage(email);
}

export async function getPumpById(pumpId: string): Promise<Pump | null> {
  return getPumpByIdInStorage(pumpId);
}

export async function getAllPumps(): Promise<Pump[]> {
  return getAllPumpsInStorage();
}

export async function updatePump(pumpId: string, updates: Partial<Pump>): Promise<Pump | null> {
  return updatePumpInStorage(pumpId, updates);
}

export async function deletePump(pumpId: string): Promise<boolean> {
  return deletePumpInStorage(pumpId);
>>>>>>> 2d242d75cdea8f65ba2668fa7f4b6a7ba774da3b
}

export async function generatePumpId(): Promise<string> {
  return generatePumpIdInStorage();
}

export async function initializePumpIndexes(): Promise<void> {
<<<<<<< HEAD
  console.log("[FileStorage] Pump file initialized");
=======
  // No-op for localStorage
>>>>>>> 2d242d75cdea8f65ba2668fa7f4b6a7ba774da3b
}
