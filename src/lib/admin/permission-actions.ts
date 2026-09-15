"use server";

import { cookies } from "next/headers";
import type { UserPermissions, PermissionGrant } from "@/lib/admin/permissions";
import type { FeatureId } from "@/lib/admin/permissions";

const PERMISSIONS_COOKIE_NAME = "petromanage_user_permissions";
const PERMISSION_GRANTS_COOKIE_NAME = "petromanage_permission_grants";

async function getStoredPermissions(): Promise<UserPermissions[]> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(PERMISSIONS_COOKIE_NAME)?.value;
    if (cookie) {
      return JSON.parse(cookie) as UserPermissions[];
    }
  } catch {
    // If cookie is invalid, return empty array
  }
  return [];
}

async function getStoredGrants(): Promise<PermissionGrant[]> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(PERMISSION_GRANTS_COOKIE_NAME)?.value;
    if (cookie) {
      return JSON.parse(cookie) as PermissionGrant[];
    }
  } catch {
    // If cookie is invalid, return empty array
  }
  return [];
}

export async function getAllPermissions(): Promise<UserPermissions[]> {
  return getStoredPermissions();
}

export async function getAllPermissionGrants(): Promise<PermissionGrant[]> {
  return getStoredGrants();
}

export async function getUserPermissions(userId: string): Promise<UserPermissions | null> {
  const permissions = await getStoredPermissions();
  return permissions.find((p) => p.userId === userId) || null;
}

export async function grantPermission(
  userId: string,
  userEmail: string,
  featureId: FeatureId,
  adminName: string,
  adminEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies();
    const grants = await getStoredGrants();
    const permissions = await getStoredPermissions();

    // Check if already granted
    const existingGrant = grants.find(
      (g) => g.userId === userId && g.featureId === featureId && !g.revokedAt
    );
    if (existingGrant) {
      return { success: false, error: "Permission already granted" };
    }

    // Create new grant
    const newGrant: PermissionGrant = {
      id: `GRANT-${Date.now()}`,
      userId,
      userEmail,
      featureId,
      grantedAt: new Date().toISOString(),
      grantedBy: `${adminName} (${adminEmail})`,
    };

    grants.push(newGrant);

    // Update user permissions
    let userPerms = permissions.find((p) => p.userId === userId);
    if (!userPerms) {
      userPerms = {
        userId,
        userEmail,
        baseRole: "user",
        customPermissions: [featureId],
        grantedAt: new Date().toISOString(),
        grantedBy: `${adminName} (${adminEmail})`,
      };
      permissions.push(userPerms);
    } else if (!userPerms.customPermissions.includes(featureId)) {
      userPerms.customPermissions.push(featureId);
    }

    cookieStore.set(PERMISSION_GRANTS_COOKIE_NAME, JSON.stringify(grants), {
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    cookieStore.set(PERMISSIONS_COOKIE_NAME, JSON.stringify(permissions), {
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: "Failed to grant permission",
    };
  }
}

export async function revokePermission(
  userId: string,
  featureId: FeatureId,
  adminName: string,
  adminEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies();
    const grants = await getStoredGrants();
    const permissions = await getStoredPermissions();

    // Find and revoke the grant
    const grant = grants.find(
      (g) => g.userId === userId && g.featureId === featureId && !g.revokedAt
    );
    if (!grant) {
      return { success: false, error: "Permission grant not found" };
    }

    grant.revokedAt = new Date().toISOString();
    grant.revokedBy = `${adminName} (${adminEmail})`;

    // Update user permissions
    const userPerms = permissions.find((p) => p.userId === userId);
    if (userPerms) {
      userPerms.customPermissions = userPerms.customPermissions.filter(
        (p) => p !== featureId
      );
    }

    cookieStore.set(PERMISSION_GRANTS_COOKIE_NAME, JSON.stringify(grants), {
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    cookieStore.set(PERMISSIONS_COOKIE_NAME, JSON.stringify(permissions), {
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: "Failed to revoke permission",
    };
  }
}

export async function hasPermission(userId: string, featureId: FeatureId): Promise<boolean> {
  const userPerms = await getUserPermissions(userId);
  if (!userPerms) return false;
  return userPerms.customPermissions.includes(featureId);
}

export async function getUsersWithPermission(featureId: FeatureId): Promise<UserPermissions[]> {
  const permissions = await getStoredPermissions();
  return permissions.filter((p) => p.customPermissions.includes(featureId));
}
