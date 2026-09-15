import { HomeIcon, BuildingIcon, UsersIcon, ShieldCheckIcon, SettingsIcon } from "@/components/icons";

export const ADMIN_NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Overview", icon: HomeIcon, match: "exact" as const },
  { href: "/admin/dashboard/pumps", label: "Pump Management", icon: BuildingIcon, match: "exact" as const },
  { href: "/admin/dashboard/pump-owners", label: "Pump Owners", icon: UsersIcon, match: "exact" as const },
  { href: "/admin/dashboard/employees", label: "Employees", icon: ShieldCheckIcon, match: "exact" as const },
  { href: "/admin/dashboard/system", label: "System Settings", icon: SettingsIcon, match: "exact" as const },
];
