import { getStorageService } from "./localStorage-service";
import type { User } from "@/lib/db/models";

const COLLECTION = "users";

let idCounter = 0;

function generateId(): string {
  idCounter++;
  return `USER-${Date.now()}-${idCounter}`;
}

export async function createUser(user: Omit<User, "_id">): Promise<User> {
  const service = getStorageService();
  const now = new Date();
  const userId = generateId();
  const userData: any = {
    ...user,
    id: userId,
    _id: userId,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  service.create(COLLECTION, userData);
  return userData;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const service = getStorageService();
  const data = service.findOne(
    COLLECTION,
    (item: any) => item.email?.toLowerCase() === email.toLowerCase()
  );
  return data ? (data as any) : null;
}

export async function getUserById(id: string): Promise<User | null> {
  const service = getStorageService();
  const data = service.read(COLLECTION, id);
  return data ? (data as any) : null;
}

export async function getAllUsers(): Promise<User[]> {
  const service = getStorageService();
  return service.readAll(COLLECTION) as any[];
}

export async function getAllUsersByRole(role: string): Promise<User[]> {
  const service = getStorageService();
  return service.query(COLLECTION, (item: any) => item.role === role) as any[];
}

export async function updateUser(
  email: string,
  updates: Partial<User>
): Promise<User | null> {
  const service = getStorageService();
  const user = service.findOne(
    COLLECTION,
    (item: any) => item.email?.toLowerCase() === email.toLowerCase()
  );
  if (!user) return null;

  const updated = service.update(COLLECTION, user.id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
  return updated ? (updated as any) : null;
}

export async function deleteUser(email: string): Promise<boolean> {
  const service = getStorageService();
  const user = service.findOne(
    COLLECTION,
    (item: any) => item.email?.toLowerCase() === email.toLowerCase()
  );
  if (!user) return false;
  return service.delete(COLLECTION, user.id);
}

export async function initializeUserIndexes(): Promise<void> {
  // No-op for localStorage
}
