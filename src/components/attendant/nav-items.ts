import { IconClock, IconDroplet, IconHome } from "@/components/icons";

export const ATTENDANT_NAV_ITEMS = [
  { href: "/attendant/dashboard", label: "Overview", icon: IconHome, match: "exact" as const },
  { href: "/attendant/dashboard/dispense", label: "Dispense & Sales", icon: IconDroplet },
  { href: "/attendant/dashboard/history", label: "Attendance & History", icon: IconClock },
];
