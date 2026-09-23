import {
  IconChat,
  IconDroplet,
  IconFileText,
  IconHome,
  IconTag,
  IconTrendingUp,
  IconTruck,
  IconUsers,
  IconWallet,
} from "@/components/icons";

export const NAV_ITEMS = [
  { href: "/pump-owner/dashboard", label: "Overview", icon: IconHome, match: "exact" as const },
  { href: "/pump-owner/dashboard/fuel-stock", label: "Fuel Stock", icon: IconDroplet },
  { href: "/pump-owner/dashboard/sales", label: "Sales", icon: IconTrendingUp },
  { href: "/pump-owner/dashboard/tankers", label: "Incoming Tanker", icon: IconTruck },
  { href: "/pump-owner/dashboard/fuel-orders", label: "Fuel Orders", icon: IconFileText },
  { href: "/pump-owner/dashboard/staff", label: "Staff", icon: IconUsers },
  { href: "/pump-owner/dashboard/payments", label: "Payments to Company", icon: IconWallet },
  { href: "/pump-owner/dashboard/connect", label: "Connect & Chat", icon: IconChat },
  { href: "/pump-owner/dashboard/fuel-price", label: "Live Fuel Price", icon: IconTag },
  { href: "/pump-owner/dashboard/reports", label: "Reports", icon: IconFileText },
];
