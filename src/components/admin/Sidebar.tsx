"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_ITEMS } from "@/components/admin/nav-items";
import { IconBuilding, IconShield, IconX } from "@/components/icons";

function isActive(pathname: string, href: string, match?: "exact") {
  if (match === "exact") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar({
  pumpCount,
  mobileOpen,
  onClose,
}: {
  pumpCount: number;
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 pb-5 pt-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white">
          <IconBuilding size={19} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink-primary">Petroleum Management System</p>
          <p className="truncate text-xs text-ink-muted">Admin console · {pumpCount} pumps</p>
        </div>
        <button onClick={onClose} className="ml-auto shrink-0 rounded-lg p-1.5 text-ink-muted hover:bg-surface-3 lg:hidden" aria-label="Close menu">
          <IconX size={18} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {ADMIN_NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href, item.match);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-brand-500 text-white shadow-sm" : "text-ink-secondary hover:bg-surface-3 hover:text-ink-primary"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="m-3 mt-2 flex items-start gap-2.5 rounded-xl bg-surface-3 p-3">
        <IconShield size={17} className="mt-0.5 shrink-0 text-brand-500" />
        <p className="text-[11px] leading-snug text-ink-muted">
          You have a read-only view across every pump in the network — each Pump Owner still manages their own data independently.
        </p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-border-subtle lg:bg-surface-1">
        {content}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[80vw] border-r border-border-subtle bg-surface-1 shadow-xl">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
