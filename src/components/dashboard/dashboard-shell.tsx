"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { BellIcon, DropletIcon, MenuIcon, XIcon } from "@/components/icons";
import { OVERVIEW_ALERTS } from "@/lib/dashboard/data/overview";
import { DASHBOARD_NAV } from "@/lib/dashboard/nav";
import { getActiveRoleSlug, getRoleBySlug, ROLES } from "@/lib/roles";

const SEVERITY_DOT = {
  critical: "bg-rose-500",
  warning: "bg-amber-500",
  info: "bg-sky-500",
} as const;

function noopSubscribe() {
  return () => {};
}

function getServerRoleSlug() {
  return ROLES[0].slug;
}

function useActiveRole() {
  const slug = useSyncExternalStore(noopSubscribe, getActiveRoleSlug, getServerRoleSlug);
  return getRoleBySlug(slug);
}

function initialsFor(label: string) {
  return label
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function useLiveClock() {
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => {
    function tick() {
      setNow(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return now;
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const clock = useLiveClock();
  const role = useActiveRole();

  const notifications =
    role.slug === "finance-manager"
      ? OVERVIEW_ALERTS.filter((alert) => /payment/i.test(alert.title) || /payment/i.test(alert.description))
      : OVERVIEW_ALERTS;

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

  const visibleNav = DASHBOARD_NAV.filter(
    (item) => !("roles" in item) || item.roles.includes(role.slug),
  );

  const activeItem =
    visibleNav.find((item) => item.href === pathname) ??
    visibleNav
      .slice()
      .reverse()
      .find((item) => pathname?.startsWith(item.href) && item.href !== "/dashboard");

  return (
    <div className="flex h-dvh flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950">
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 transform flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 dark:border-slate-800 dark:bg-slate-900 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-5 dark:border-slate-800">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm">
              <DropletIcon className="size-5" />
            </span>
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              PetroManage
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
            className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 lg:hidden dark:text-slate-400"
          >
            <XIcon className="size-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          {visibleNav.map((item) => {
            const isActive = item === activeItem;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {mobileOpen && (
        <div
          aria-hidden
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white/85 px-4 backdrop-blur sm:px-6 dark:border-slate-800 dark:bg-slate-950/85">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 lg:hidden dark:border-slate-700 dark:text-slate-200"
            >
              <MenuIcon className="size-5" />
            </button>
            <p className="hidden text-sm font-semibold text-slate-900 sm:block dark:text-white">
              {activeItem?.label ?? `${role.label} Dashboard`}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden items-center gap-1.5 text-xs font-medium text-slate-500 sm:flex dark:text-slate-400">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {clock ?? "--:--:--"}
            </span>
            <Link
              href="/"
              className="hidden rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 sm:block dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Exit to website
            </Link>

            <div ref={notifRef} className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={notifOpen}
                aria-label={`${notifications.length} notifications`}
                className="relative inline-flex size-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <BellIcon className="size-5" />
                {notifications.length > 0 && (
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
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                        You&apos;re all caught up.
                      </p>
                    ) : (
                      notifications.map((alert) => (
                        <div
                          key={alert.id}
                          className="flex items-start gap-2.5 border-b border-slate-100 px-4 py-3 last:border-0 dark:border-slate-700/60"
                        >
                          <span className={`mt-1 size-1.5 shrink-0 rounded-full ${SEVERITY_DOT[alert.severity]}`} />
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{alert.title}</p>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{alert.description}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 py-1.5 pl-1.5 pr-3 dark:border-slate-800">
              <span className="flex size-7 items-center justify-center rounded-md bg-slate-900 text-xs font-bold text-amber-400 dark:bg-amber-500 dark:text-slate-950">
                {initialsFor(role.label)}
              </span>
              <span className="hidden text-xs font-medium text-slate-700 sm:block dark:text-slate-200">
                {role.label}
              </span>
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
