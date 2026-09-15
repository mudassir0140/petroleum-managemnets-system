import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminDashboardShell } from "@/components/admin/AdminDashboardShell";

export const metadata: Metadata = {
  title: "Admin Dashboard | PetroManage",
  description: "Admin control center with full system access and control.",
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Admin uses AdminDashboardShell which sets admin role for full access
  // Auth is handled by individual pages/route groups (e.g., (auth) group doesn't require auth)
  return <AdminDashboardShell>{children}</AdminDashboardShell>;
}
