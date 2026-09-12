"use client";

import { useState, type ReactNode } from "react";
import { AttendantSidebar } from "@/components/attendant/Sidebar";
import { AttendantHeader } from "@/components/attendant/Header";
import type { Pump } from "@/lib/types";
import type { AttendantSession } from "@/lib/attendant/types";

export function AttendantShell({
  session,
  pump,
  shiftActive,
  logoutAction,
  children,
}: {
  session: AttendantSession;
  pump: Pump;
  shiftActive: boolean;
  logoutAction: () => Promise<void>;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-2">
      <AttendantSidebar session={session} pump={pump} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="lg:pl-64">
        <AttendantHeader session={session} pump={pump} shiftActive={shiftActive} onMenuClick={() => setMobileOpen(true)} logoutAction={logoutAction} />
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
