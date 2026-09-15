"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AdminAccount, AdminSession } from "@/lib/admin/types";

const ADMIN_COOKIE_NAME = "admin_session";
const ADMIN_STORAGE_COOKIE_NAME = "petromanage_admins_store";

// Get stored admin accounts - includes default account and any newly created accounts
async function getStoredAdmins(): Promise<AdminAccount[]> {
  const defaultAdmins: AdminAccount[] = [
    {
      id: "ADM-001",
      fullName: "Ali Raza",
      email: "admin@petromanage.demo",
      password: "admin123",
      createdAt: "2024-01-01T00:00:00Z",
    },
  ];

  try {
    const cookieStore = await cookies();
    const storedAdminsCookie = cookieStore.get(ADMIN_STORAGE_COOKIE_NAME)?.value;
    if (storedAdminsCookie) {
      const createdAdmins = JSON.parse(storedAdminsCookie) as AdminAccount[];
      return [...defaultAdmins, ...createdAdmins];
    }
  } catch {
    // If cookie is invalid, just return default admins
  }

  return defaultAdmins;
}

export async function adminLogin(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const admins = await getStoredAdmins();
  const admin = admins.find(
    (a) => a.email === email && a.password === password
  );

  if (!admin) {
    return {
      success: false,
      error: "Invalid email or password",
    };
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, JSON.stringify({
    adminId: admin.id,
    adminName: admin.fullName,
    adminEmail: admin.email,
    role: "admin",
  }), {
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return { success: true };
}

export async function adminSignup(
  fullName: string,
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const admins = await getStoredAdmins();

  // Check if email already exists
  if (admins.some((a) => a.email === email)) {
    return {
      success: false,
      error: "Email already registered",
    };
  }

  // Create new admin account
  const newAdmin: AdminAccount = {
    id: `ADM-${Date.now()}`,
    fullName,
    email,
    password, // In production, this would be hashed
    createdAt: new Date().toISOString(),
  };

  try {
    const cookieStore = await cookies();
    const storedAdminsCookie = cookieStore.get(ADMIN_STORAGE_COOKIE_NAME)?.value;
    let createdAdmins: AdminAccount[] = [];

    if (storedAdminsCookie) {
      createdAdmins = JSON.parse(storedAdminsCookie);
    }

    createdAdmins.push(newAdmin);
    cookieStore.set(ADMIN_STORAGE_COOKIE_NAME, JSON.stringify(createdAdmins), {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

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
