"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AdminAccount, AdminSession } from "@/lib/admin/types";

const ADMIN_COOKIE_NAME = "admin_session";
const ADMIN_STORAGE_KEY = "petromanage_admins";

// Get stored admin accounts from cookies
function getStoredAdmins(): AdminAccount[] {
  // For demo purposes, we'll use a hardcoded admin account
  // In production, this would be a database
  return [
    {
      id: "ADM-001",
      fullName: "Ali Raza",
      email: "admin@petromanage.demo",
      password: "admin123", // In production, this would be hashed
      createdAt: "2024-01-01T00:00:00Z",
    },
  ];
}

export async function adminLogin(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const admins = getStoredAdmins();
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
  const admins = getStoredAdmins();

  // Check if email already exists
  if (admins.some((a) => a.email === email)) {
    return {
      success: false,
      error: "Email already registered",
    };
  }

  // For demo purposes, reject all signup attempts
  // In production, you'd store the new admin in a database
  return {
    success: false,
    error: "Admin account creation is restricted. Use existing admin credentials to login.",
  };
}

export async function adminLogout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  redirect("/admin/login");
}
