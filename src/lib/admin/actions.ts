"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AdminAccount, AdminSession } from "@/lib/admin/types";
import {
  getStoredAdmins as getStoredAdminsFromStorage,
  createAdmin as createAdminInStorage,
  initializeAdmins,
} from "@/lib/storage/admins-storage";

const ADMIN_COOKIE_NAME = "admin_session";

async function getStoredAdmins(): Promise<AdminAccount[]> {
  await initializeAdmins();
  return getStoredAdminsFromStorage();
}

export async function adminLogin(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const admins = await getStoredAdmins();
  const admin = admins.find((a) => a.email === email && a.password === password);

  if (!admin) {
    return {
      success: false,
      error: "Invalid email or password",
    };
  }

  const cookieStore = await cookies();
  cookieStore.set(
    ADMIN_COOKIE_NAME,
    JSON.stringify({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      role: "admin",
    }),
    {
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    }
  );

  return { success: true };
}

export async function adminSignup(
  fullName: string,
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const admins = await getStoredAdmins();

  if (admins.some((a) => a.email === email)) {
    return {
      success: false,
      error: "Email already registered",
    };
  }

  const newAdmin: AdminAccount = {
    id: `ADM-${Date.now()}`,
    fullName,
    email,
    password,
    createdAt: new Date().toISOString(),
  };

  try {
    await createAdminInStorage(newAdmin);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: "Failed to create admin account",
    };
  }
}

export async function adminLogout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  redirect("/admin/login");
}
