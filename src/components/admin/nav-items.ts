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

export const ADMIN_NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Overview", icon: HomeIcon, match: "exact" as const },

  // Operations Management
  { href: "/admin/dashboard/pumps", label: "Pumps", icon: BuildingIcon, match: "exact" as const },
  { href: "/admin/dashboard/pump-owners", label: "Pump Owners", icon: UsersIcon, match: "exact" as const },
  { href: "/admin/dashboard/tankers", label: "Tankers & Drivers", icon: TruckIcon, match: "exact" as const },

  // People Management
  { href: "/admin/dashboard/employees", label: "Employees", icon: UsersIcon, match: "exact" as const },
  { href: "/admin/dashboard/roles", label: "Company Roles", icon: ShieldCheckIcon, match: "exact" as const },

  // Finance & Operations
  { href: "/admin/dashboard/finance", label: "Finance & Payments", icon: WalletIcon, match: "exact" as const },
  { href: "/admin/dashboard/fuel-management", label: "Fuel & Stock", icon: ClipboardIcon, match: "exact" as const },

  // System Management
  { href: "/admin/dashboard/access-control", label: "Access Control", icon: LockIcon, match: "exact" as const },
  { href: "/admin/dashboard/system", label: "System Settings", icon: SettingsIcon, match: "exact" as const },
];
