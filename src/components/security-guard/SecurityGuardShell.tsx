"use client";

import { useState, type ReactNode } from "react";
import { SecurityGuardSidebar } from "@/components/security-guard/Sidebar";
import { SecurityGuardHeader } from "@/components/security-guard/Header";
import type { Pump } from "@/lib/types";
import type { SecurityGuardSession } from "@/lib/security-guard/types";

export function SecurityGuardShell({
  session,
  pump,
  onDuty,
  logoutAction,
  children,
}: {
  session: SecurityGuardSession;
  pump: Pump;
  onDuty: boolean;
  logoutAction: () => Promise<void>;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-2">
      <SecurityGuardSidebar session={session} pump={pump} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="lg:pl-64">
        <SecurityGuardHeader session={session} pump={pump} onDuty={onDuty} onMenuClick={() => setMobileOpen(true)} logoutAction={logoutAction} />
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
