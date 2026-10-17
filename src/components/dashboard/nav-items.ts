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
  { href: "/pumpadmin", label: "Overview", icon: IconHome, match: "exact" as const },
  { href: "/pumpadmin/fuel-stock", label: "Fuel Stock", icon: IconDroplet },
  { href: "/pumpadmin/sales", label: "Sales", icon: IconTrendingUp },
  { href: "/pumpadmin/tankers", label: "Incoming Tanker", icon: IconTruck },
  { href: "/pumpadmin/fuel-orders", label: "Fuel Orders", icon: IconFileText },
  { href: "/pumpadmin/staff", label: "Staff", icon: IconUsers },
  { href: "/pumpadmin/payments", label: "Payments to Company", icon: IconWallet },
  { href: "/pumpadmin/khata/accounts", label: "Khata Accounts", icon: IconFileText },
  { href: "/pumpadmin/bank", label: "Bank", icon: IconWallet },
  { href: "/pumpadmin/wallet", label: "Mobile Wallet", icon: IconTag },
  { href: "/pumpadmin/connect", label: "Connect & Chat", icon: IconChat },
  { href: "/pumpadmin/fuel-price", label: "Live Fuel Price", icon: IconTag },
  { href: "/pumpadmin/reports", label: "Reports", icon: IconFileText },
];
