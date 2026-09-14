"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_ITEMS } from "@/components/admin/nav-items";
import { IconChevronDown, IconLogOut, IconMenu } from "@/components/icons";
import type { AdminSession } from "@/lib/admin/types";

export function AdminHeader({
  session,
  onMenuClick,
  logoutAction,
}: {
  session: AdminSession;
  onMenuClick: () => void;
  logoutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);

  const currentLabel =
    ADMIN_NAV_ITEMS.find((item) => (item.match === "exact" ? pathname === item.href : pathname.startsWith(item.href)))?.label ?? "Dashboard";

  const initials = session.adminName
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
        <p className="truncate text-xs text-ink-muted">Network-wide view</p>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-2 hover:bg-surface-3"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-xs font-semibold text-white">{initials}</span>
            <span className="hidden text-left sm:block">
              <span className="block text-xs font-medium text-ink-primary">{session.adminName}</span>
              <span className="block text-[11px] text-ink-muted">Admin</span>
            </span>
            <IconChevronDown size={15} className="hidden text-ink-muted sm:block" />
          </button>
          {profileOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-border-subtle bg-surface-1 p-2 shadow-lg">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-ink-primary">{session.adminName}</p>
                  <p className="truncate text-xs text-ink-muted">{session.adminEmail}</p>
                </div>
                <div className="my-1 h-px bg-border-subtle" />
                <div className="px-3 py-2 text-xs text-ink-muted">
                  <p>
                    Role: <span className="font-medium text-ink-secondary">Admin</span>
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
