"use client";

import { useState, type ReactNode } from "react";
import { CashierSidebar } from "@/components/cashier/Sidebar";
import { CashierHeader } from "@/components/cashier/Header";
import type { Pump } from "@/lib/types";
import type { CashierSession } from "@/lib/cashier/types";

export function CashierShell({
  session,
  pump,
  shiftActive,
  logoutAction,
  children,
}: {
  session: CashierSession;
  pump: Pump;
  shiftActive: boolean;
  logoutAction: () => Promise<void>;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-2">
      <CashierSidebar session={session} pump={pump} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="lg:pl-64">
        <CashierHeader session={session} pump={pump} shiftActive={shiftActive} onMenuClick={() => setMobileOpen(true)} logoutAction={logoutAction} />
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
