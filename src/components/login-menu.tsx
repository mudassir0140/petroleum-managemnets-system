"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "@/components/icons";
import { ROLES, setActiveRole } from "@/lib/roles";

export function LoginMenu({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  // Filter out internal roles (like admin) from the login menu
  const visibleRoles = ROLES.filter((role) => !("internal" in role && role.internal));
  const singleRole = visibleRoles.length === 1 ? visibleRoles[0] : null;

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Single role case
  if (singleRole) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <Link
          href={singleRole.dashboardHref}
          onClick={() => setActiveRole(singleRole.slug)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
        >
          Roles Test
        </Link>
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          Login
        </Link>
      </div>
    );
  }

  // Multiple roles case
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div ref={rootRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
        >
          Roles Test
          <ChevronDownIcon
            className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-800"
          >
            <p className="px-4 pb-1.5 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Open dashboard as
            </p>
            <div className="max-h-80 overflow-y-auto p-1.5 pt-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {visibleRoles.map((role) => (
                <Link
                  key={role.slug}
                  href={role.dashboardHref}
                  role="menuitem"
                  onClick={() => {
                    setActiveRole(role.slug);
                    setOpen(false);
                  }}
                  className="flex flex-col rounded-lg px-3 py-2 text-sm transition hover:bg-slate-100 dark:hover:bg-slate-700/60"
                >
                  <span className="font-medium text-slate-900 dark:text-white">
                    {role.label}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {role.description}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <Link
        href="/auth/login"
        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 dark:bg-blue-600 dark:hover:bg-blue-700"
      >
        Login
      </Link>
    </div>
  );
}
