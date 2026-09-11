export const ROLES = [
  {
    slug: "company-owner",
    label: "Company Owner",
    description: "Full business, fleet & finance access",
    dashboardHref: "/dashboard",
    demoEmail: "owner@petromanage.com",
  },
  {
    slug: "company-manager",
    label: "Company Manager",
    description: "Daily network operations & coordination",
    dashboardHref: "/manager",
    demoEmail: "manager@petromanage.com",
  },
  {
    slug: "finance-manager",
    label: "Finance Manager",
    description: "Revenue, expenses, payments & payroll",
    dashboardHref: "/dashboard/finance",
    demoEmail: "finance@petromanage.com",
  },
  {
    slug: "hr-manager",
    label: "HR Manager",
    description: "Employees, departments, attendance & payroll coordination",
    dashboardHref: "/dashboard/hr/employees",
    demoEmail: "hr@petromanage.com",
  },
  {
    slug: "depot-manager",
    label: "Fuel/Depot Manager",
    description: "Depot stock, fuel receiving & distribution to pumps",
    dashboardHref: "/dashboard/depot/stock",
    demoEmail: "depot@petromanage.com",
  },
  {
    slug: "logistics-manager",
    label: "Tanker/Logistics Manager",
    description: "Fleet, drivers, routes, dispatch & delivery tracking",
    dashboardHref: "/dashboard/logistics/tanker-fleet",
    demoEmail: "logistics@petromanage.com",
  },
  {
    slug: "sales-manager",
    label: "Sales Manager",
    description: "Pump-wise sales, performance tracking & sales reporting",
    dashboardHref: "/dashboard/sales/pump-wise",
    demoEmail: "sales@petromanage.com",
  },
  {
    slug: "it-admin",
    label: "IT/System Admin",
    description: "System users, permissions, technical settings & access",
    dashboardHref: "/dashboard/admin/users",
    demoEmail: "it@petromanage.com",
  },
  {
    slug: "area-manager",
    label: "City/Area Manager",
    description: "City/region pump oversight, visits, coordination & issue escalation",
    dashboardHref: "/dashboard/area/pumps-overview",
    demoEmail: "area@petromanage.com",
  },
  {
    slug: "depot-staff",
    label: "Depot Staff",
    description: "Load tankers, record loading quantity & time, and report depot stock levels",
    dashboardHref: "/dashboard/depot-staff/load-tankers",
    demoEmail: "depotstaff@petromanage.com",
  },
  {
    slug: "dispatch-officer",
    label: "Dispatch Officer",
    description: "Schedule tanker trips, assign drivers & pumps, and track departures & arrivals",
    dashboardHref: "/dashboard/dispatch/schedule-trips",
    demoEmail: "dispatch@petromanage.com",
  },
  {
    slug: "quality-control-officer",
    label: "Quality Control Officer",
    description: "Fuel quality testing, adulteration checks & inspection logging",
    dashboardHref: "/dashboard/quality/fuel-testing",
    demoEmail: "quality@petromanage.com",
  },
  {
    slug: "tanker-driver",
    label: "Tanker Driver",
    description: "Trip schedule, departure/arrival logging, fuel loaded/unloaded & delivery confirmation",
    dashboardHref: "/dashboard/driver/schedule",
    demoEmail: "driver@petromanage.com",
  },
  {
    slug: "accounts-officer",
    label: "Accounts Officer",
    description: "Company-level payment processing, invoicing & pump owner ledger",
    dashboardHref: "/dashboard/accounts/payments",
    demoEmail: "accounts@petromanage.com",
  },
  {
    slug: "hr-officer",
    label: "HR Officer",
    description: "Employee records and attendance & payroll processing",
    dashboardHref: "/dashboard/hr-officer/employee-records",
    demoEmail: "hrofficer@petromanage.com",
  },
] as const;

export type RoleSlug = (typeof ROLES)[number]["slug"];

/**
 * Demo-only "session": which role is currently active, kept in localStorage.
 * Swap the read/write below for real auth (session/cookie lookup) later —
 * every call site just asks for the active role slug, not how it's stored.
 */
const ACTIVE_ROLE_STORAGE_KEY = "petromanage:active-role";

export function isRoleSlug(value: string | null | undefined): value is RoleSlug {
  return !!value && ROLES.some((role) => role.slug === value);
}

export function getRoleBySlug(slug: string | null | undefined) {
  return ROLES.find((role) => role.slug === slug) ?? ROLES[0];
}

export function setActiveRole(slug: RoleSlug) {
  try {
    window.localStorage.setItem(ACTIVE_ROLE_STORAGE_KEY, slug);
  } catch {
    // Storage unavailable (e.g. private browsing) — role just won't persist.
  }
}

export function getActiveRoleSlug(): RoleSlug {
  try {
    const stored = window.localStorage.getItem(ACTIVE_ROLE_STORAGE_KEY);
    if (isRoleSlug(stored)) return stored;
  } catch {
    // Storage unavailable — fall back to the default role below.
  }
  return ROLES[0].slug;
}
