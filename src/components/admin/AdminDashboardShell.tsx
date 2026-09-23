import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

// This shell only ever renders inside app/admin/(dashboard)/layout.tsx,
// which already calls getAdminSession() (redirects to /admin/login
// otherwise) — so by the time we're here the viewer is a real,
// server-verified Admin. No client-side role lookup needed or wanted.
export function AdminDashboardShell({ children }: { children: ReactNode }) {
  return <DashboardShell roleSlug="admin">{children}</DashboardShell>;
}
