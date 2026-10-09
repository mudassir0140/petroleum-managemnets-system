"use client";

import { type ReactNode } from "react";
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
  return (
    <div className="min-h-screen bg-surface-2">
      <AttendantHeader session={session} pump={pump} shiftActive={shiftActive} onMenuClick={() => {}} logoutAction={logoutAction} />
      <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
