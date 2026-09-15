export const FEATURES = [
  {
    id: "view-dashboard",
    name: "View Dashboard",
    category: "Core",
    description: "Access to admin dashboard overview",
  },
  {
    id: "manage-roles",
    name: "Manage Roles",
    category: "Administration",
    description: "View and manage company roles",
  },
  {
    id: "manage-users",
    name: "Manage Users",
    category: "Administration",
    description: "Create, edit, and manage user accounts",
  },
  {
    id: "manage-permissions",
    name: "Manage Permissions",
    category: "Administration",
    description: "Grant and revoke permissions to users and roles",
  },
  {
    id: "view-finance",
    name: "View Finance",
    category: "Finance",
    description: "Access financial data and reports",
  },
  {
    id: "manage-finance",
    name: "Manage Finance",
    category: "Finance",
    description: "Create and modify financial transactions",
  },
  {
    id: "view-payroll",
    name: "View Payroll",
    category: "Finance",
    description: "View payroll information",
  },
  {
    id: "manage-payroll",
    name: "Manage Payroll",
    category: "Finance",
    description: "Create and process payroll",
  },
  {
    id: "view-reports",
    name: "View Reports",
    category: "Reports",
    description: "Access system reports",
  },
  {
    id: "manage-reports",
    name: "Manage Reports",
    category: "Reports",
    description: "Create and manage custom reports",
  },
  {
    id: "view-pumps",
    name: "View Pumps",
    category: "Operations",
    description: "View pump information",
  },
  {
    id: "manage-pumps",
    name: "Manage Pumps",
    category: "Operations",
    description: "Create, edit, and manage pumps",
  },
  {
    id: "view-employees",
    name: "View Employees",
    category: "HR",
    description: "View employee records",
  },
  {
    id: "manage-employees",
    name: "Manage Employees",
    category: "HR",
    description: "Create and manage employee records",
  },
  {
    id: "view-fuel-management",
    name: "View Fuel Management",
    category: "Operations",
    description: "View fuel stock and distribution",
  },
  {
    id: "manage-fuel-management",
    name: "Manage Fuel Management",
    category: "Operations",
    description: "Manage fuel stock and distribution",
  },
  {
    id: "view-tankers",
    name: "View Tankers",
    category: "Logistics",
    description: "View tanker fleet information",
  },
  {
    id: "manage-tankers",
    name: "Manage Tankers",
    category: "Logistics",
    description: "Manage tanker fleet",
  },
  {
    id: "view-pump-owners",
    name: "View Pump Owners",
    category: "Administration",
    description: "View pump owner information",
  },
  {
    id: "manage-pump-owners",
    name: "Manage Pump Owners",
    category: "Administration",
    description: "Manage pump owner accounts",
  },
] as const;

export type FeatureId = (typeof FEATURES)[number]["id"];

export interface UserPermissions {
  userId: string;
  userEmail: string;
  baseRole: string;
  customPermissions: FeatureId[];
  grantedAt: string;
  grantedBy: string;
}

export interface PermissionGrant {
  id: string;
  userId: string;
  userEmail: string;
  featureId: FeatureId;
  grantedAt: string;
  grantedBy: string;
  revokedAt?: string;
  revokedBy?: string;
}

export function getFeatureById(id: string): (typeof FEATURES)[number] | undefined {
  return FEATURES.find((f) => f.id === id);
}

export function getFeaturesByCategory(category: string) {
  return FEATURES.filter((f) => f.category === category);
}

export function getCategories() {
  return Array.from(new Set(FEATURES.map((f) => f.category)));
}
