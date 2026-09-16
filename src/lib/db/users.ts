"use server";

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
}

export async function userExists(email: string): Promise<boolean> {
  const user = await getUserByEmail(email);
  return !!user;
}

export async function initializeUserIndexes(): Promise<void> {
  // No-op for localStorage
}
