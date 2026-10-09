"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UsersIcon, ClockIcon, DocumentIcon, WalletIcon, XIcon, MenuIcon } from "@/components/icons";
import { useState } from "react";

const EMPLOYEES_NAV_ITEMS = [
  { href: "/dashboard/employees", label: "Overview", icon: UsersIcon },
  { href: "/dashboard/employees/attendance", label: "Attendance", icon: ClockIcon },
  { href: "/dashboard/employees/directory", label: "Directory", icon: DocumentIcon },
  { href: "/dashboard/employees/payroll", label: "Payroll", icon: WalletIcon },
];

export function EmployeesSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeItem = EMPLOYEES_NAV_ITEMS.find((item) => {
    if (item.href === "/dashboard/employees") {
      return pathname === "/dashboard/employees";
    }
    return pathname?.startsWith(item.href);
  });

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col overflow-y-auto border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:flex">
        <div className="flex h-16 items-center border-b border-slate-200 px-6 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Employees</h2>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-4">
          {EMPLOYEES_NAV_ITEMS.map((item) => {
            const isActive = item === activeItem;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
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

      {/* Mobile hamburger button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
        className="fixed left-4 top-4 z-50 inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 lg:hidden dark:border-slate-700 dark:text-slate-200"
      >
        <MenuIcon className="size-5" />
      </button>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            aria-hidden
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
          />
          <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col overflow-y-auto border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:hidden">
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Employees</h2>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
                className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 dark:text-slate-400"
              >
                <XIcon className="size-5" />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1 p-4">
              {EMPLOYEES_NAV_ITEMS.map((item) => {
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
        </>
      )}
    </>
  );
}
