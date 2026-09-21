"use server";

import { readJSON, writeJSON } from "./file-storage";
import type { User } from "./models";

const FILENAME = "users.json";

export async function createUser(user: Omit<User, "_id">): Promise<User> {
  const users = await getAllUsers();
  const now = new Date().toISOString();

  const newUser: User = {
    ...user,
    createdAt: typeof user.createdAt === "string" ? user.createdAt : now,
    updatedAt: typeof user.updatedAt === "string" ? user.updatedAt : now,
  };

  users.push(newUser);
  await writeJSON(FILENAME, users);
  return newUser;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await getAllUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function getUserById(id: string): Promise<User | null> {
  // File-based storage doesn't use ObjectId
  return null;
}

export async function getAllUsers(): Promise<User[]> {
  return readJSON<User>(FILENAME);
}

export async function updateUser(email: string, updates: Partial<User>): Promise<User | null> {
  const users = await getAllUsers();
  const index = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());

  if (index === -1) return null;

  const updated: User = {
    ...users[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  users[index] = updated;
  await writeJSON(FILENAME, users);
  return updated;
}

export async function deleteUser(email: string): Promise<boolean> {
  const users = await getAllUsers();
  const index = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());

  if (index === -1) return false;

  users.splice(index, 1);
  await writeJSON(FILENAME, users);
  return true;
}

export async function userExists(email: string): Promise<boolean> {
  const user = await getUserByEmail(email);
  return !!user;
}

export async function initializeUserIndexes(): Promise<void> {
  console.log("[FileStorage] User file initialized");
}
