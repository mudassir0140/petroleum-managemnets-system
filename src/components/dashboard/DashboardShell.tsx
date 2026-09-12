"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header, type DashboardNotification } from "@/components/dashboard/Header";
import type { Pump, PumpOwnerSession } from "@/lib/types";

export function DashboardShell({
  session,
  pump,
  notifications,
  logoutAction,
  children,
}: {
  session: PumpOwnerSession;
  pump: Pump;
  notifications: DashboardNotification[];
  logoutAction: () => Promise<void>;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-2">
      <div className="no-print">
        <Sidebar pump={pump} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      </div>
      <div className="print:pl-0 lg:pl-64">
        <div className="no-print">
          <Header session={session} pump={pump} notifications={notifications} onMenuClick={() => setMobileOpen(true)} logoutAction={logoutAction} />
        </div>
        <main className="px-4 py-6 sm:px-6 print:p-0 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
