"use server";

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
}

export async function generatePumpId(): Promise<string> {
  return generatePumpIdInStorage();
}

export async function initializePumpIndexes(): Promise<void> {
  // No-op for localStorage
}
