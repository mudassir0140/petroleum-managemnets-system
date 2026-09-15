"use client";

import { useEffect, ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export function AdminDashboardShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Set admin as the active role so they have access to all navigation items
    try {
      localStorage.setItem("petromanage:active-role", "admin");
    } catch {
      // Storage unavailable (e.g. private browsing)
    }
  }, []);

  return <DashboardShell>{children}</DashboardShell>;
}
