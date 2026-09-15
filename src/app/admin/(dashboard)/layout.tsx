import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminDashboardShell } from "@/components/admin/AdminDashboardShell";
import { getAdminSession } from "@/lib/admin/session";

export const metadata: Metadata = {
  title: "Admin Dashboard | PetroManage",
  description: "Admin control center with full system access and control.",
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  await getAdminSession();
  return <AdminDashboardShell>{children}</AdminDashboardShell>;
}
