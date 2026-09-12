"use client";

import { useState, type ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/Sidebar";
import { AdminHeader } from "@/components/admin/Header";
import type { AdminSession } from "@/lib/admin/types";

export function AdminShell({
  session,
  pumpCount,
  logoutAction,
  children,
}: {
  session: AdminSession;
  pumpCount: number;
  logoutAction: () => Promise<void>;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-2">
      <AdminSidebar pumpCount={pumpCount} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="lg:pl-64">
        <AdminHeader session={session} onMenuClick={() => setMobileOpen(true)} logoutAction={logoutAction} />
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
