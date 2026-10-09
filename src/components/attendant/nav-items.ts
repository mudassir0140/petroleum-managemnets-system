import { IconClock, IconUsers, IconHome } from "@/components/icons";

export const ATTENDANT_NAV_ITEMS = [
  { href: "/attendant/dashboard", label: "Overview", icon: IconHome, match: "exact" as const },
  { href: "/attendant/dashboard/employees", label: "Employees", icon: IconUsers },
  { href: "/attendant/dashboard/attendance", label: "Attendance", icon: IconClock },
];
