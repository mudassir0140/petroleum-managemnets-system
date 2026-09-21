"use server";

<<<<<<< HEAD
import { readJSON, writeJSON } from "./file-storage";

export interface User {
  email: string;
  passwordHash: string;
  role: "pump-owner" | "employee" | "admin" | "pump-owner-manager";
  pumpId?: string;
  employeeId?: string;
  approvalStatus: "pending" | "approved" | "rejected";
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

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
=======
import {
  createUser as createUserInStorage,
  getUserByEmail as getUserByEmailInStorage,
  getUserById as getUserByIdInStorage,
  getAllUsers as getAllUsersInStorage,
  updateUser as updateUserInStorage,
  deleteUser as deleteUserInStorage,
} from "@/lib/storage/users-storage";
import type { User } from "./models";

export async function createUser(user: Omit<User, "_id">): Promise<User> {
  return createUserInStorage(user);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return getUserByEmailInStorage(email);
}

export async function getUserById(id: string): Promise<User | null> {
  return getUserByIdInStorage(id);
}

export async function getAllUsers(): Promise<User[]> {
  return getAllUsersInStorage();
}

export async function updateUser(email: string, updates: Partial<User>): Promise<User | null> {
  return updateUserInStorage(email, updates);
}

export async function deleteUser(email: string): Promise<boolean> {
  return deleteUserInStorage(email);
>>>>>>> 2d242d75cdea8f65ba2668fa7f4b6a7ba774da3b
}

export async function userExists(email: string): Promise<boolean> {
  const user = await getUserByEmail(email);
  return !!user;
}

export async function initializeUserIndexes(): Promise<void> {
<<<<<<< HEAD
  console.log("[FileStorage] User file initialized");
=======
  // No-op for localStorage
>>>>>>> 2d242d75cdea8f65ba2668fa7f4b6a7ba774da3b
}
