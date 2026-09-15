import { useEffect, useState } from "react";
import { getAllPermissions } from "@/lib/admin/permission-actions";
import type { FeatureId } from "@/lib/admin/permissions";
import type { UserPermissions } from "@/lib/admin/permissions";

export function usePermissions(userId?: string) {
  const [permissions, setPermissions] = useState<Map<string, FeatureId[]>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPermissions() {
      try {
        const perms = await getAllPermissions();
        const permMap = new Map<string, FeatureId[]>();

        perms.forEach((p) => {
          permMap.set(p.userId, p.customPermissions);
        });

        setPermissions(permMap);
      } catch (error) {
        console.error("Failed to load permissions:", error);
      } finally {
        setLoading(false);
      }
    }

    loadPermissions();
  }, []);

  const hasPermission = (uId: string, featureId: FeatureId): boolean => {
    const userPermissions = permissions.get(uId);
    return userPermissions?.includes(featureId) ?? false;
  };

  const getUserPermissions = (uId: string): FeatureId[] => {
    return permissions.get(uId) ?? [];
  };

  return {
    loading,
    hasPermission,
    getUserPermissions,
    allPermissions: permissions,
  };
}
