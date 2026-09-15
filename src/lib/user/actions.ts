"use server";

import { cookies } from "next/headers";
import type { UserAccount, UserSession } from "@/lib/user/types";

const USER_COOKIE_NAME = "user_session";
const USERS_STORAGE_COOKIE_NAME = "petromanage_users_store";

const DEFAULT_DEMO_USERS: UserAccount[] = [
  {
    id: "user-attendant-001",
    email: "attendant@petromanage.demo",
    password: "demo123",
    role: "attendant",
    createdAt: new Date().toISOString(),
  },
  {
    id: "user-cashier-001",
    email: "cashier@petromanage.demo",
    password: "demo123",
    role: "cashier",
    createdAt: new Date().toISOString(),
  },
  {
    id: "user-guard-001",
    email: "guard@petromanage.demo",
    password: "demo123",
    role: "security_guard",
    createdAt: new Date().toISOString(),
  },
  {
    id: "user-pumpmanager-001",
    email: "pumpmanager@petromanage.demo",
    password: "demo123",
    role: "pump_manager",
    createdAt: new Date().toISOString(),
  },
  {
    id: "user-admin-001",
    email: "admin@petromanage.demo",
    password: "demo123",
    role: "admin",
    createdAt: new Date().toISOString(),
  },
];

async function getStoredUsers(): Promise<UserAccount[]> {
  try {
    const cookieStore = await cookies();
    const storedUsersCookie = cookieStore.get(USERS_STORAGE_COOKIE_NAME)?.value;
    if (storedUsersCookie) {
      return JSON.parse(storedUsersCookie) as UserAccount[];
    }
  } catch {
    // If cookie is invalid, return empty array
  }
  // Seed demo users on first access
  const cookieStore = await cookies();
  cookieStore.set(USERS_STORAGE_COOKIE_NAME, JSON.stringify(DEFAULT_DEMO_USERS), {
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  return DEFAULT_DEMO_USERS;
}

export async function userLogin(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; dashboardHref?: string }> {
  const users = await getStoredUsers();
  const user = users.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) {
    return {
      success: false,
      error: "Invalid email or password",
    };
  }

  const cookieStore = await cookies();
  const session: UserSession = {
    userId: user.id,
    email: user.email,
    role: user.role,
    createdAt: new Date().toISOString(),
  };

  cookieStore.set(USER_COOKIE_NAME, JSON.stringify(session), {
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  // Find dashboard href for role - auto-detect from user's role
  const { ROLES } = await import("@/lib/roles");
  const roleConfig = ROLES.find((r) => r.slug === user.role);
  const dashboardHref = roleConfig?.dashboardHref || "/dashboard";

  return { success: true, dashboardHref };
}

export async function userSignup(
  email: string,
  password: string,
  role: string
): Promise<{ success: boolean; error?: string; dashboardHref?: string }> {
  // Validate role - exclude Company Owner
  const { ROLES } = await import("@/lib/roles");
  const isValidRole = ROLES.some(
    (r) => r.slug === role && r.slug !== "company-owner"
  );

  if (!isValidRole) {
    return {
      success: false,
      error: "Invalid role selected",
    };
  }

  const users = await getStoredUsers();

  // Check if email already exists
  if (users.some((u) => u.email === email)) {
    return {
      success: false,
      error: "Email already registered",
    };
  }

  // Create new user
  const newUser: UserAccount = {
    id: `USER-${Date.now()}`,
    email,
    password, // In production, this would be hashed
    role,
    createdAt: new Date().toISOString(),
  };

  try {
    const cookieStore = await cookies();
    users.push(newUser);
    cookieStore.set(USERS_STORAGE_COOKIE_NAME, JSON.stringify(users), {
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    // Create session and redirect
    const session: UserSession = {
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.createdAt,
    };

    cookieStore.set(USER_COOKIE_NAME, JSON.stringify(session), {
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    const roleConfig = ROLES.find((r) => r.slug === role);
    const dashboardHref = roleConfig?.dashboardHref || "/dashboard";

    return { success: true, dashboardHref };
  } catch (error) {
    return {
      success: false,
      error: "Failed to create account",
    };
  }
}

export async function userLogout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(USER_COOKIE_NAME);
}
