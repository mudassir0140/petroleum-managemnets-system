import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { adminLogout } from "@/lib/admin/actions";

// This shell only ever renders inside app/admin/(dashboard)/layout.tsx,
// which already calls getAdminSession() (redirects to /developer
// otherwise) — so by the time we're here the viewer is a real,
// server-verified Admin. No client-side role lookup needed or wanted.
// Logout uses the shared admin logout, which clears every session cookie.
export function AdminDashboardShell({ children }: { children: ReactNode }) {
  return (
    <DashboardShell roleSlug="admin" logoutAction={adminLogout}>
      {children}
    </DashboardShell>
  );
}
