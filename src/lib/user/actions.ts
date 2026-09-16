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

  // Check if user is disabled (admin-created accounts can be disabled)
  if (user.createdBy && user.enabled === false) {
    return {
      success: false,
      error: "This account has been disabled by an administrator",
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

  // Special validation for pump-owner role
  if (role === "pump-owner") {
    try {
      const { getStoredPumps } = await import("@/lib/pump-owner/storage");
      const pumps = await getStoredPumps();

      // Check if email matches any pump's assigned email
      const matchingPump = pumps.find((p) => p.ownerEmail.toLowerCase() === email.toLowerCase());

      if (!matchingPump) {
        return {
          success: false,
          error: "This email is not authorized for pump owner signup. Please contact admin.",
        };
      }

      // Check if email is already used for this pump
      const users = await getStoredUsers();
      if (users.some((u) => u.email.toLowerCase() === email.toLowerCase() && u.role === "pump-owner")) {
        return {
          success: false,
          error: "This email is already registered as a pump owner",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: "Failed to verify pump owner credentials",
      };
    }
  }

  const users = await getStoredUsers();

  // Check if email already exists
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
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

// Admin functions for managing company role accounts
export async function adminCreateUser(
  name: string,
  email: string,
  password: string,
  role: string,
  adminId: string
): Promise<{ success: boolean; error?: string; userId?: string }> {
  // Validate role is a company role
  const { isCompanyRole, ROLES } = await import("@/lib/roles");

  if (!isCompanyRole(role)) {
    return {
      success: false,
      error: "Invalid role selected. Only company roles can be created.",
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
    id: `ADMIN-${Date.now()}`,
    name,
    email,
    password,
    role,
    createdAt: new Date().toISOString(),
    createdBy: adminId,
    enabled: true,
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

    return { success: true, userId: newUser.id };
  } catch (error) {
    return {
      success: false,
      error: "Failed to create user account",
    };
  }
}

export async function adminGetAllUsers(): Promise<UserAccount[]> {
  const users = await getStoredUsers();
  // Return only admin-created users (those with createdBy field)
  return users.filter((u) => u.createdBy);
}

export async function adminUpdateUser(
  userId: string,
  updates: Partial<UserAccount>
): Promise<{ success: boolean; error?: string }> {
  const users = await getStoredUsers();
  const userIndex = users.findIndex((u) => u.id === userId);

  if (userIndex === -1) {
    return { success: false, error: "User not found" };
  }

  // Only allow updating specific fields
  const allowedUpdates = ["name", "enabled"];
  const filteredUpdates = Object.entries(updates)
    .filter(([key]) => allowedUpdates.includes(key))
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

  users[userIndex] = { ...users[userIndex], ...filteredUpdates };

  try {
    const cookieStore = await cookies();
    cookieStore.set(USERS_STORAGE_COOKIE_NAME, JSON.stringify(users), {
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update user" };
  }
}

export async function adminDeleteUser(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const users = await getStoredUsers();
  const userIndex = users.findIndex((u) => u.id === userId);

  if (userIndex === -1) {
    return { success: false, error: "User not found" };
  }

  users.splice(userIndex, 1);

  try {
    const cookieStore = await cookies();
    cookieStore.set(USERS_STORAGE_COOKIE_NAME, JSON.stringify(users), {
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete user" };
  }
}

export async function adminDisableUser(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  return adminUpdateUser(userId, { enabled: false });
}

export async function adminEnableUser(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  return adminUpdateUser(userId, { enabled: true });
}
