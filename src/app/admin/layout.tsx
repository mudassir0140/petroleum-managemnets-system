import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminDashboardShell } from "@/components/admin/AdminDashboardShell";
import { getAdminSession } from "@/lib/admin/session";

export const metadata: Metadata = {
  title: "Admin Dashboard | PetroManage",
  description: "Admin control center with full system access and control.",
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Verify admin session - this will redirect to login if not authenticated
  const session = await getAdminSession();

  // Admin uses AdminDashboardShell which sets admin role for full access
  return <AdminDashboardShell>{children}</AdminDashboardShell>;
}
