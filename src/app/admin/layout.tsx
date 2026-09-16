import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
  // Base layout for /admin routes
  // (auth) routes: login/signup - no auth required
  // (dashboard) routes: protected dashboard - auth required + AdminDashboardShell
  return children;
}
