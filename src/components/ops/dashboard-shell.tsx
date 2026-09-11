"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import type { IconProps } from "@/components/icons";
import { BellIcon, DropletIcon, LogOutIcon, MenuIcon, XIcon } from "@/components/icons";

export interface DashboardNavItem {
  href: string;
  label: string;
  icon: ComponentType<IconProps>;
}

export interface DashboardAlert {
  id: string;
  message: string;
  severity: "critical" | "warning" | "info";
}

const SEVERITY_DOT = {
  critical: "bg-rose-500",
  warning: "bg-amber-500",
  info: "bg-sky-500",
} as const;

export function DashboardShell({
  nav,
  roleLabel,
  roleTag,
  userName,
  userInitials,
  switchRoleHref,
  switchRoleLabel,
  alerts = [],
  children,
}: {
  nav: DashboardNavItem[];
  roleLabel: string;
  roleTag: string;
  userName: string;
  userInitials: string;
  switchRoleHref?: string;
  switchRoleLabel?: string;
  alerts?: DashboardAlert[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const activeItem = useMemo(() => {
    const sorted = [...nav].sort((a, b) => b.href.length - a.href.length);
    return sorted.find((item) => pathname === item.href || pathname.startsWith(item.href + "/"));
  }, [nav, pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setNotifOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="flex h-dvh min-h-0 overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white lg:flex dark:border-slate-800 dark:bg-slate-900">
        <SidebarContent
          nav={nav}
          pathname={pathname}
          roleLabel={roleLabel}
          roleTag={roleTag}
          switchRoleHref={switchRoleHref}
          switchRoleLabel={switchRoleLabel}
        />
      </aside>

      {/* Mobile off-canvas sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="relative flex w-72 max-w-[85vw] flex-col overflow-hidden border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation menu"
              className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <XIcon className="size-5" />
            </button>
            <SidebarContent
              nav={nav}
              pathname={pathname}
              roleLabel={roleLabel}
              roleTag={roleTag}
              switchRoleHref={switchRoleHref}
              switchRoleLabel={switchRoleLabel}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 dark:border-slate-800 dark:bg-slate-900/90">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 lg:hidden dark:border-slate-700 dark:text-slate-300"
          >
            <MenuIcon className="size-5" />
          </button>

          <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900 sm:text-base dark:text-white">
            {activeItem?.label ?? roleLabel}
          </h2>

          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={notifOpen}
              aria-label={`${alerts.length} active alerts`}
              className="relative flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <BellIcon className="size-5" />
              {alerts.length > 0 && (
                <span className="absolute right-1.5 top-1.5 flex size-2 rounded-full bg-rose-500" />
              )}
            </button>

            {notifOpen && (
              <div
                role="menu"
                className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-800"
              >
                <p className="border-b border-slate-100 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:border-slate-700 dark:text-slate-500">
                  Notifications
                </p>
                <div className="max-h-80 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {alerts.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                      You&apos;re all caught up.
                    </p>
                  ) : (
                    alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="flex items-start gap-2.5 border-b border-slate-100 px-4 py-3 last:border-0 dark:border-slate-700/60"
                      >
                        <span className={`mt-1 size-1.5 shrink-0 rounded-full ${SEVERITY_DOT[alert.severity]}`} />
                        <p className="text-sm text-slate-700 dark:text-slate-200">{alert.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="hidden items-center gap-2.5 border-l border-slate-200 pl-3 sm:flex dark:border-slate-800">
            <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-xs font-bold text-white">
              {userInitials}
            </span>
            <div className="leading-tight">
              <p className="text-sm font-medium text-slate-900 dark:text-white">{userName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{roleLabel}</p>
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({
  nav,
  pathname,
  roleLabel,
  roleTag,
  switchRoleHref,
  switchRoleLabel,
  onNavigate,
}: {
  nav: DashboardNavItem[];
  pathname: string;
  roleLabel: string;
  roleTag: string;
  switchRoleHref?: string;
  switchRoleLabel?: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <Link href="/" className="flex shrink-0 items-center gap-2.5 px-5 pb-2 pt-4">
        <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <DropletIcon className="size-5" />
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            PetroManage
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400">
            {roleTag}
          </span>
        </span>
      </Link>

      <nav className="mt-2 min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {nav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              }`}
            >
              <Icon className="size-4.5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-slate-100 px-3 py-2 dark:border-slate-800">
        <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {roleLabel}
        </p>
        {switchRoleHref && (
          <Link
            href={switchRoleHref}
            className="flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            {switchRoleLabel}
          </Link>
        )}
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <LogOutIcon className="size-4.5 shrink-0" />
          Sign out
        </Link>
      </div>
    </>
  );
}
