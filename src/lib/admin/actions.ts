"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  adminLogin as mongoAdminLogin,
  adminSignup as mongoAdminSignup,
  endAdminSession,
  startAdminSession,
} from "@/lib/db/admin-service";

const ADMIN_COOKIE_NAME = "admin_session";

// Every login cookie this app sets. Logout clears all of them, so no role stays signed in.
const AUTH_COOKIES = [
  ADMIN_COOKIE_NAME,
  "employee_session",
  "pump_owner_session",
  "khata_client_session",
  "supplier_session",
  "truck_session",
  "pp_demo_role",
  "user_session",
];

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

  const adminId = admin._id!.toString();
  const sessionToken = await startAdminSession(adminId);

  const cookieStore = await cookies();
  cookieStore.set(
    ADMIN_COOKIE_NAME,
    JSON.stringify({
      adminId,
      adminName: admin.name,
      adminEmail: admin.email,
      role: "admin",
      sessionToken,
    }),
    {
      maxAge: 60 * 60 * 24 * 365,
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
  const result = await mongoAdminSignup(email, password, fullName);

  if (result.error) {
    console.error("[AdminSignup] Signup failed:", result.error);
    return {
      success: false,
      error: result.error,
    };
  }

  if (!result.admin) {
    console.error("[AdminSignup] Unknown error: admin was null but no error message provided");
    return {
      success: false,
      error: "Failed to create account. Please try again.",
    };
  }

  console.log("[AdminSignup] Account created successfully for:", result.admin.email);
  return { success: true };
}

// Full logout (Exit to website on the admin dashboard): ends the server session,
// clears every auth cookie, then sends the visitor to the website.
export async function adminLogout(): Promise<void> {
  const cookieStore = await cookies();
  let adminId = "";
  try {
    adminId = String(JSON.parse(cookieStore.get(ADMIN_COOKIE_NAME)?.value ?? "{}").adminId ?? "");
  } catch {
    adminId = "";
  }
  if (adminId) await endAdminSession(adminId);
  for (const name of AUTH_COOKIES) {
    cookieStore.set(name, "", { path: "/", maxAge: 0 });
  }
  redirect("/");
}
