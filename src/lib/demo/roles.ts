// Demo Role Login: there is no real credential check in this project — the
// visitor simply declares which role they want to explore and the app trusts
// it, scoping every dashboard's data/actions to that role's fixed demo
// account. This file is imported from proxy.ts (edge-safe: no "fs"/"crypto"),
// Server Components, Server Actions and the client-side role picker alike, so
// it must stay a plain, dependency-free module.
export type DemoRole = "admin" | "pump_owner" | "attendant" | "cashier";

export const DEMO_ROLE_COOKIE_NAME = "pp_demo_role";

export interface RoleMeta {
  value: DemoRole;
  label: string;
  dashboardPath: string;
}

export const ROLE_OPTIONS: RoleMeta[] = [
  { value: "admin", label: "Admin", dashboardPath: "/admin/dashboard" },
  { value: "pump_owner", label: "Pump Owner", dashboardPath: "/pump-owner/dashboard" },
  { value: "attendant", label: "Fuel Attendant / Pump Operator", dashboardPath: "/attendant/dashboard" },
  { value: "cashier", label: "Cashier", dashboardPath: "/cashier/dashboard" },
];

const ROLE_META_BY_VALUE = new Map(ROLE_OPTIONS.map((r) => [r.value, r]));

export function isDemoRole(value: string | undefined | null): value is DemoRole {
  return !!value && ROLE_META_BY_VALUE.has(value as DemoRole);
}

export function getRoleMeta(role: DemoRole): RoleMeta {
  const meta = ROLE_META_BY_VALUE.get(role);
  if (!meta) throw new Error(`Unknown demo role: ${role}`);
  return meta;
}
