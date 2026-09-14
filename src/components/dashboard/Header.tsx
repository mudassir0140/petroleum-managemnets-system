"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/components/dashboard/nav-items";
import { IconBell, IconChevronDown, IconLogOut, IconMenu } from "@/components/icons";
import { Badge } from "@/components/ui/Badge";
import { formatPumpAddress } from "@/lib/format";
import type { PumpOwnerSession, Pump } from "@/lib/types";

export interface DashboardNotification {
  id: string;
  title: string;
  message: string;
  tone: "good" | "warning" | "critical" | "brand";
}

export function Header({
  session,
  pump,
  notifications,
  onMenuClick,
  logoutAction,
}: {
  session: PumpOwnerSession;
  pump: Pump;
  notifications: DashboardNotification[];
  onMenuClick: () => void;
  logoutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const currentLabel = NAV_ITEMS.find((item) => (item.match === "exact" ? pathname === item.href : pathname.startsWith(item.href)))?.label ?? "Dashboard";

  const initials = session.ownerName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border-subtle bg-surface-1/90 px-4 backdrop-blur sm:px-6">
      <button onClick={onMenuClick} className="rounded-lg p-2 text-ink-secondary hover:bg-surface-3 lg:hidden" aria-label="Open menu">
        <IconMenu size={20} />
      </button>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink-primary">{currentLabel}</p>
        <p className="truncate text-xs text-ink-muted">{pump.name} · {formatPumpAddress(pump)}</p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen((v) => !v);
              setProfileOpen(false);
            }}
            className="relative rounded-lg p-2 text-ink-secondary hover:bg-surface-3"
            aria-label="Notifications"
          >
            <IconBell size={19} />
            {notifications.length > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full" style={{ background: "var(--status-critical)" }} />
            )}
          </button>
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-80 max-w-[85vw] rounded-xl border border-border-subtle bg-surface-1 p-2 shadow-lg">
                <div className="flex items-center justify-between px-2 py-1.5">
                  <p className="text-sm font-semibold text-ink-primary">Notifications</p>
                  <span className="text-xs text-ink-muted">{notifications.length} new</span>
                </div>
                <div className="max-h-80 space-y-1 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-2 py-6 text-center text-xs text-ink-muted">You&apos;re all caught up.</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="rounded-lg px-2 py-2 hover:bg-surface-2">
                        <div className="flex items-center gap-2">
                          <Badge tone={n.tone} dot>
                            {n.title}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-ink-secondary">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setProfileOpen((v) => !v);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-2 hover:bg-surface-3"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-xs font-semibold text-white">
              {initials}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-xs font-medium text-ink-primary">{session.ownerName}</span>
              <span className="block text-[11px] text-ink-muted">Pump Owner</span>
            </span>
            <IconChevronDown size={15} className="hidden text-ink-muted sm:block" />
          </button>
          {profileOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-border-subtle bg-surface-1 p-2 shadow-lg">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-ink-primary">{session.ownerName}</p>
                  <p className="truncate text-xs text-ink-muted">{session.ownerEmail}</p>
                </div>
                <div className="my-1 h-px bg-border-subtle" />
                <div className="px-3 py-2 text-xs text-ink-muted">
                  <p>
                    Pump ID: <span className="font-medium text-ink-secondary">{pump.id}</span>
                  </p>
                  <p className="mt-0.5">
                    Role: <span className="font-medium text-ink-secondary">Pump Owner</span>
                  </p>
                </div>
                <div className="my-1 h-px bg-border-subtle" />
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-ink-secondary hover:bg-surface-3"
                  >
                    <IconLogOut size={15} />
                    Sign out
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
