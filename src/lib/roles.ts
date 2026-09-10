export const ROLES = [
  {
    slug: "administrator",
    label: "Administrator",
    description: "Full system & user access",
  },
  {
    slug: "depot-manager",
    label: "Depot Manager",
    description: "Storage, stock & transfers",
  },
  {
    slug: "station-operator",
    label: "Station Operator",
    description: "Sales & pump operations",
  },
  {
    slug: "distributor",
    label: "Distributor",
    description: "Orders & delivery tracking",
  },
  {
    slug: "auditor",
    label: "Auditor",
    description: "Read-only reports & compliance",
  },
] as const;

export type RoleSlug = (typeof ROLES)[number]["slug"];
