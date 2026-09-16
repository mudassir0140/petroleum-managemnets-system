import { getStorageService } from "./localStorage-service";
import type { PermissionGrant, UserPermissions } from "@/lib/admin/permissions";
import type { FeatureId } from "@/lib/admin/permissions";

const GRANTS_COLLECTION = "permission_grants";
const PERMISSIONS_COLLECTION = "user_permissions";

export async function createPermissionGrant(grant: PermissionGrant): Promise<PermissionGrant> {
  const service = getStorageService();
  service.create(GRANTS_COLLECTION, {
    ...grant,
    id: grant.id,
  });
  return grant;
}

export async function getPermissionGrantById(id: string): Promise<PermissionGrant | null> {
  const service = getStorageService();
  const data = service.read(GRANTS_COLLECTION, id);
  return data ? (data as any) : null;
}

export async function getAllPermissionGrants(): Promise<PermissionGrant[]> {
  const service = getStorageService();
  return service.readAll(GRANTS_COLLECTION) as any[];
}

export async function getActivePermissionGrants(): Promise<PermissionGrant[]> {
  const service = getStorageService();
  return service.query(
    GRANTS_COLLECTION,
    (item: any) => !item.revokedAt
  ) as any[];
}

export async function getGrantsForUser(userId: string): Promise<PermissionGrant[]> {
  const service = getStorageService();
  return service.query(
    GRANTS_COLLECTION,
    (item: any) => item.userId === userId && !item.revokedAt
  ) as any[];
}

export async function revokePermissionGrant(
  grantId: string,
  revokedBy: string
): Promise<PermissionGrant | null> {
  const service = getStorageService();
  return service.update(GRANTS_COLLECTION, grantId, {
    revokedAt: new Date().toISOString(),
    revokedBy,
  }) as any;
}

// User Permissions operations
export async function createUserPermissions(
  permissions: UserPermissions
): Promise<UserPermissions> {
  const service = getStorageService();
  service.create(PERMISSIONS_COLLECTION, {
    ...permissions,
    id: permissions.userId,
  });
  return permissions;
}

export async function getUserPermissions(userId: string): Promise<UserPermissions | null> {
  const service = getStorageService();
  const data = service.read(PERMISSIONS_COLLECTION, userId);
  return data ? (data as any) : null;
}

export async function updateUserPermissions(
  userId: string,
  updates: Partial<UserPermissions>
): Promise<UserPermissions | null> {
  const service = getStorageService();
  const updated = service.update(PERMISSIONS_COLLECTION, userId, updates);
  return updated ? (updated as any) : null;
}

export async function addCustomPermission(
  userId: string,
  featureId: FeatureId
): Promise<void> {
  const service = getStorageService();
  const permissions = await getUserPermissions(userId);
  if (permissions) {
    const current = permissions.customPermissions || [];
    if (!current.includes(featureId)) {
      current.push(featureId);
      await updateUserPermissions(userId, {
        customPermissions: current,
      });
    }
  }
}

export async function removeCustomPermission(
  userId: string,
  featureId: FeatureId
): Promise<void> {
  const service = getStorageService();
  const permissions = await getUserPermissions(userId);
  if (permissions) {
    const current = permissions.customPermissions || [];
    const filtered = current.filter((p) => p !== featureId);
    await updateUserPermissions(userId, {
      customPermissions: filtered,
    });
  }
}
