import { IconClock, IconFileText, IconHome, IconWallet } from "@/components/icons";

export const CASHIER_NAV_ITEMS = [
  { href: "/cashier/dashboard", label: "Overview", icon: IconHome, match: "exact" as const },
  { href: "/cashier/dashboard/collect", label: "Collect Payment", icon: IconWallet },
  { href: "/cashier/dashboard/history", label: "Shift & Payment History", icon: IconClock },
  { href: "/cashier/dashboard/reports", label: "Daily Cash Report", icon: IconFileText },
];
