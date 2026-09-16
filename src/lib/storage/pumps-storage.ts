import { getStorageService } from "./localStorage-service";
import type { Pump } from "@/lib/db/models";

const COLLECTION = "pumps";

export async function createPump(pump: Omit<Pump, "_id">): Promise<Pump> {
  const service = getStorageService();
  const now = new Date();
  const pumpData: any = {
    ...pump,
    _id: pump.pumpId,
    id: pump.pumpId,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  service.create(COLLECTION, pumpData);
  return pumpData;
}

export async function getPumpById(pumpId: string): Promise<Pump | null> {
  const service = getStorageService();
  const data = service.read(COLLECTION, pumpId);
  return data ? (data as any) : null;
}

export async function getPumpByEmail(email: string): Promise<Pump | null> {
  const service = getStorageService();
  const data = service.findOne(
    COLLECTION,
    (item: any) => item.ownerEmail?.toLowerCase() === email.toLowerCase()
  );
  return data ? (data as any) : null;
}

export async function getAllPumps(): Promise<Pump[]> {
  const service = getStorageService();
  return service.readAll(COLLECTION) as any[];
}

export async function updatePump(
  pumpId: string,
  updates: Partial<Pump>
): Promise<Pump | null> {
  const service = getStorageService();
  const updated = service.update(COLLECTION, pumpId, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
  return updated ? (updated as any) : null;
}

export async function deletePump(pumpId: string): Promise<boolean> {
  const service = getStorageService();
  return service.delete(COLLECTION, pumpId);
}

export async function generatePumpId(): Promise<string> {
  return `PUMP-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 9)
    .toUpperCase()}`;
}

export async function initializePumpIndexes(): Promise<void> {
  // No-op for localStorage
}
