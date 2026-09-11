import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const metadata: Metadata = {
  title: "Company Owner Dashboard | PetroManage",
  description:
    "Company owner control center for pumps, fuel stock, tanker fleet, payments, employees, finance and reporting.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
