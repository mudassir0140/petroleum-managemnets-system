import type { UserPermissions } from "@/lib/admin/permissions";

// Demo users with sample permissions for testing
export const DEMO_USERS_WITH_PERMISSIONS: UserPermissions[] = [
  {
    userId: "USR-001",
    userEmail: "finance-manager@petromanage.demo",
    baseRole: "Finance Manager",
    customPermissions: [
      "view-dashboard",
      "view-finance",
      "manage-finance",
      "view-payroll",
      "manage-payroll",
      "view-reports",
    ],
    grantedAt: "2024-09-01T10:00:00Z",
    grantedBy: "Admin (admin@petromanage.demo)",
  },
  {
    userId: "USR-002",
    userEmail: "company-manager@petromanage.demo",
    baseRole: "Company Manager",
    customPermissions: [
      "view-dashboard",
      "manage-pumps",
      "manage-employees",
      "view-reports",
      "view-finance",
    ],
    grantedAt: "2024-09-02T10:00:00Z",
    grantedBy: "Admin (admin@petromanage.demo)",
  },
  {
    userId: "USR-003",
    userEmail: "pump-manager@petromanage.demo",
    baseRole: "Pump Manager",
    customPermissions: [
      "view-dashboard",
      "view-pumps",
      "manage-employees",
    ],
    grantedAt: "2024-09-03T10:00:00Z",
    grantedBy: "Admin (admin@petromanage.demo)",
  },
];

export function getDemoPermissionsForUser(userId: string): UserPermissions | undefined {
  return DEMO_USERS_WITH_PERMISSIONS.find((u) => u.userId === userId);
}

export function getDemoUsersByPermission(featureId: string): UserPermissions[] {
  return DEMO_USERS_WITH_PERMISSIONS.filter((u) =>
    u.customPermissions.includes(featureId as any)
  );
}
