"use client";

import {
  ClipboardIcon,
  DocumentIcon,
  HomeIcon,
  MessageIcon,
  PhoneIcon,
  TankIcon,
  TrendingUpIcon,
  TruckIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/icons";
import { DashboardShell, type DashboardNavItem } from "@/components/ops/dashboard-shell";
import { useAlerts } from "@/lib/store/use-tasks";

export const MANAGER_NAV: DashboardNavItem[] = [
  { href: "/manager", label: "Overview", icon: HomeIcon },
  { href: "/manager/pumps", label: "Pump Operations", icon: TankIcon },
  { href: "/manager/tankers", label: "Tanker Dispatch", icon: TruckIcon },
  { href: "/manager/coordination", label: "Pump Owner Coordination", icon: PhoneIcon },
  { href: "/manager/employees", label: "Employee Management", icon: UsersIcon },
  { href: "/manager/finance", label: "Daily Finance", icon: WalletIcon },
  { href: "/manager/tasks", label: "Tasks & Alerts", icon: ClipboardIcon },
  { href: "/manager/reports", label: "Reports", icon: DocumentIcon },
  { href: "/manager/chat", label: "Connect & Chat", icon: MessageIcon },
  { href: "/manager/fuel-prices", label: "Live Fuel Prices", icon: TrendingUpIcon },
];

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const { alerts } = useAlerts();

  return (
    <DashboardShell
      nav={MANAGER_NAV}
      roleLabel="Company Manager"
      roleTag="Manager Console"
      userName="Aditya Malhotra"
      userInitials="AM"
      switchRoleHref="/owner-console"
      switchRoleLabel="Owner fuel price control"
      alerts={alerts.map((alert) => ({ id: alert.id, message: alert.message, severity: alert.severity }))}
    >
      {children}
    </DashboardShell>
  );
}
