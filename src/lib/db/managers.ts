"use server";

import { readJSON, writeJSON } from "./file-storage";

export interface ManagerProfile {
  managerId: string;
  name: string;
  email: string;
  contactNumber: string;
  address: string;
  pumpId: string;
  pumpName: string;
  password: string;
  createdAt: string;
  updatedAt: string;
}

const FILENAME = "managers.json";

export async function createManager(manager: Omit<ManagerProfile, "_id">): Promise<ManagerProfile> {
  const managers = await getAllManagers();
  const now = new Date().toISOString();

  const newManager: ManagerProfile = {
    ...manager,
    createdAt: typeof manager.createdAt === "string" ? manager.createdAt : now,
    updatedAt: typeof manager.updatedAt === "string" ? manager.updatedAt : now,
  };

  managers.push(newManager);
  await writeJSON(FILENAME, managers);
  return newManager;
}

export async function getManagerByEmail(email: string): Promise<ManagerProfile | null> {
  const managers = await getAllManagers();
  return managers.find((m) => m.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function getManagerById(managerId: string): Promise<ManagerProfile | null> {
  const managers = await getAllManagers();
  return managers.find((m) => m.managerId === managerId) || null;
}

export async function getManagersByPumpId(pumpId: string): Promise<ManagerProfile[]> {
  const managers = await getAllManagers();
  return managers.filter((m) => m.pumpId === pumpId);
}

export async function getAllManagers(): Promise<ManagerProfile[]> {
  return readJSON<ManagerProfile>(FILENAME);
}

export async function updateManager(managerId: string, updates: Partial<ManagerProfile>): Promise<ManagerProfile | null> {
  const managers = await getAllManagers();
  const index = managers.findIndex((m) => m.managerId === managerId);

  if (index === -1) return null;

  const updated: ManagerProfile = {
    ...managers[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  managers[index] = updated;
  await writeJSON(FILENAME, managers);
  return updated;
}

export async function deleteManager(managerId: string): Promise<boolean> {
  const managers = await getAllManagers();
  const index = managers.findIndex((m) => m.managerId === managerId);

  if (index === -1) return false;

  managers.splice(index, 1);
  await writeJSON(FILENAME, managers);
  return true;
}

export async function generateManagerId(): Promise<string> {
  return `MGR-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}

export async function initializeManagerIndexes(): Promise<void> {
  console.log("[FileStorage] Manager file initialized");
}
