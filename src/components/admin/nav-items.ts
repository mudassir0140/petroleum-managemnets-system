import {
  HomeIcon,
  BuildingIcon,
  UsersIcon,
  ShieldCheckIcon,
  SettingsIcon,
  TruckIcon,
  WalletIcon,
  ClipboardIcon,
  LockIcon
} from "@/components/icons";

// NOTE: `(dashboard)` under src/app/admin/ is a Next.js route GROUP — it does
// not appear in the URL. So src/app/admin/(dashboard)/pumps/page.tsx resolves
// to /admin/pumps, not /admin/dashboard/pumps. Links below match the real
// folder structure; entries with no matching page yet are left as future
// placeholders (they 404 until that page is built, same as before).
export const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: HomeIcon, match: "exact" as const },

  // Operations Management
  { href: "/admin/pumps", label: "Pumps", icon: BuildingIcon, match: "exact" as const },
  { href: "/admin/pump-owners", label: "Pump Owners", icon: UsersIcon, match: "exact" as const },
  { href: "/admin/tankers", label: "Tankers & Drivers", icon: TruckIcon, match: "exact" as const },

  // People Management
  { href: "/admin/employees", label: "Employees", icon: UsersIcon, match: "exact" as const },
  { href: "/admin/signup-requests", label: "Employee Signup Requests", icon: UsersIcon, match: "exact" as const },
  { href: "/admin/pump-owner-requests", label: "Pump Owner Requests", icon: UsersIcon, match: "exact" as const },
  { href: "/admin/role-create", label: "Company Roles", icon: ShieldCheckIcon, match: "exact" as const },

  // Finance & Operations
  { href: "/admin/finance", label: "Finance & Payments", icon: WalletIcon, match: "exact" as const },
  { href: "/admin/fuel-management", label: "Fuel & Stock", icon: ClipboardIcon, match: "exact" as const },

  // System Management
  { href: "/admin/access-control", label: "Access Control", icon: LockIcon, match: "exact" as const },
  { href: "/admin/permissions", label: "Permission Management", icon: ShieldCheckIcon, match: "exact" as const },
  { href: "/admin/system", label: "System Settings", icon: SettingsIcon, match: "exact" as const },
];
