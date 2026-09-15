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
  {
    slug: "pump-attendant",
    label: "Pump Attendant",
    description: "Start shifts, dispense fuel & log sales at the pump",
    dashboardHref: "/dashboard/attendant",
    demoEmail: "attendant@petromanage.com",
  },
  {
    slug: "cashier",
    label: "Cashier",
    description: "Collect payments, log transactions & submit cash handovers",
    dashboardHref: "/dashboard/cashier",
    demoEmail: "cashier@petromanage.com",
  },
  {
    slug: "pump-owner",
    label: "Pump Owner",
    description: "Self-service view of your pump's stock, sales, staff & payments",
    dashboardHref: "/dashboard/pump-owner",
    demoEmail: "pumpowner@petromanage.com",
  },
  {
    slug: "pump-manager",
    label: "Pump Manager",
    description: "Day-to-day oversight of your assigned pump's operations, staff & stock",
    dashboardHref: "/dashboard/pump-manager",
    demoEmail: "pumpmanager@petromanage.com",
  },
  {
    slug: "maintenance-technician",
    label: "Maintenance Technician",
    description: "Dispenser & pump machine maintenance, repair tracking and scheduled servicing for your assigned pumps",
    dashboardHref: "/dashboard/maintenance",
    demoEmail: "maintenance@petromanage.com",
  },
  {
    slug: "admin",
    label: "System Administrator",
    description: "Full system control and access to all modules",
    dashboardHref: "/admin",
    demoEmail: "admin@petromanage.demo",
    internal: true, // Hidden from normal role selection
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

// Company roles that admins can create - excludes pump roles
const COMPANY_ROLE_SLUGS = [
  "company-owner",
  "company-manager",
  "finance-manager",
  "hr-manager",
  "depot-manager",
  "logistics-manager",
  "sales-manager",
  "it-admin",
  "accounts-officer",
  "hr-officer",
  "quality-control-officer",
  "dispatch-officer",
] as const;

export function isCompanyRole(slug: string | null | undefined): boolean {
  return !!slug && COMPANY_ROLE_SLUGS.includes(slug as any);
}

export function getCompanyRoles() {
  return ROLES.filter((role) => isCompanyRole(role.slug));
}
