import type { ReactNode } from "react";
import { requirePumpOwnerAuth } from "@/lib/pump-owner/actions";
import { getStoredPumps } from "@/lib/pump-owner/storage";

export const dynamic = "force-dynamic";

export default async function PumpOwnerDashboardLayout({ children }: { children: ReactNode }) {
  const session = await requirePumpOwnerAuth();
  const pumps = await getStoredPumps();
  const pump = pumps.find(p => p.pumpId === session.pumpId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {pump?.pumpName || "Pump Dashboard"}
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Welcome, {session.ownerName}
              </p>
            </div>
            <div className="flex gap-2">
              <a
                href="/pump-owner/dashboard/settings"
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
              >
                Settings
              </a>
              <a
                href="/pump-owner/logout"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                Logout
              </a>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
