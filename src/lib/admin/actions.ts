"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  adminLogin as mongoAdminLogin,
  adminSignup as mongoAdminSignup,
} from "@/lib/db/admin-service";

const ADMIN_COOKIE_NAME = "admin_session";

// Single source of truth: the MongoDB `admins` collection (lib/db/admin-service.ts).
// The cookie keeps the legacy field names (adminId/adminName/adminEmail) because
// the admin dashboard shell, header, and nav-active-state logic already read
// those names in ~20 files — only the data source underneath changed.
export async function adminLogin(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const admin = await mongoAdminLogin(email, password);

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
      adminId: admin._id!.toString(),
      adminName: admin.name,
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
  const admin = await mongoAdminSignup(email, password, fullName);

  if (!admin) {
    return {
      success: false,
      error: "Email already registered, or failed to create admin account",
    };
  }

  return { success: true };
}

export async function adminLogout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  redirect("/admin/login");
}
