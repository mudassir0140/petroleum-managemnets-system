"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { NAV_ITEMS } from "@/components/dashboard/nav-items";
import { IconBell, IconChevronDown, IconLogOut, IconMenu, IconArrowLeft } from "@/components/icons";
import { Badge } from "@/components/ui/Badge";
import { PumpSwitcher } from "@/components/pump-owner/PumpSwitcher";
import { formatDateTime, formatPumpAddress } from "@/lib/format";
import { useLivePoll } from "@/lib/khata/use-live-poll";
import type { BellItem } from "@/components/notifications/NotificationBell";
import { ChangePasswordModal } from "@/components/dashboard/ChangePasswordModal";
import type { PumpOwnerSession, Pump } from "@/lib/types";

// The live feed of database notifications, shown first in the bell. Pump admin pages pass it; others pass nothing.
export type LiveFeed = { listUrl: string; readUrlBase: string };

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
  liveFeed,
}: {
  session: PumpOwnerSession;
  pump: Pump;
  notifications: DashboardNotification[];
  onMenuClick: () => void;
  logoutAction: () => Promise<void>;
  liveFeed?: LiveFeed;
}) {
  const pathname = usePathname();
  const [notifOpen, setNotifOpen] = useState(false);
  const router = useRouter();
  const [live, setLive] = useState<BellItem[]>([]);
  const [liveUnread, setLiveUnread] = useState(0);

  // Polls the database notifications every 5 seconds, the same feed the bell used on each page before.
  useLivePoll(
    async () => {
      if (!liveFeed) return;
      const response = await fetch(liveFeed.listUrl, { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      setLive(Array.isArray(data.items) ? data.items : []);
      setLiveUnread(Number(data.unread) || 0);
    },
    5000,
    [liveFeed?.listUrl],
    Boolean(liveFeed)
  );

  // Marks a live item read, then opens the request it points to.
  async function openLive(item: BellItem) {
    setNotifOpen(false);
    if (!item.read) {
      setLive((list) => list.map((i) => (i.id === item.id ? { ...i, read: true } : i)));
      setLiveUnread((count) => Math.max(0, count - 1));
      if (liveFeed) await fetch(`${liveFeed.readUrlBase}/${item.id}/read`, { method: "POST", cache: "no-store" }).catch(() => undefined);
    }
    if (item.href) router.push(item.href);
  }
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // A click or tap anywhere outside the open panel closes it (and Escape closes both).
  // This is a document listener, not a full-page overlay: the header's backdrop-filter would
  // otherwise trap the overlay inside the header, so clicks on the page below did nothing.
  useEffect(() => {
    if (!notifOpen && !profileOpen) return;
    function closeIfOutside(event: Event) {
      const target = event.target as Node;
      if (notifRef.current?.contains(target) || profileRef.current?.contains(target)) return;
      setNotifOpen(false);
      setProfileOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setNotifOpen(false);
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", closeIfOutside);
    document.addEventListener("touchstart", closeIfOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", closeIfOutside);
      document.removeEventListener("touchstart", closeIfOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [notifOpen, profileOpen]);

  const isMainDashboard = pathname === "/pumpadmin";
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

      {!isMainDashboard && (
        <Link
          href="/pumpadmin"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-brand-500 hover:bg-surface-2 transition-colors"
          aria-label="Back to dashboard"
        >
          <IconArrowLeft size={16} />
          <span className="hidden sm:inline">Back</span>
          <span className="hidden sm:inline text-ink-muted">/</span>
          <span className="hidden sm:inline">واپس</span>
        </Link>
      )}

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink-primary">{currentLabel}</p>
        <p className="truncate text-xs text-ink-muted">{pump.name} · {formatPumpAddress(pump)}</p>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <PumpSwitcher currentPumpId={pump.id} ownerEmail={session.ownerEmail} />
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setNotifOpen((v) => !v);
              setProfileOpen(false);
            }}
            className="relative rounded-lg p-2 text-ink-secondary hover:bg-surface-3"
            aria-label="Notifications"
          >
            <IconBell size={19} />
            {(notifications.length > 0 || liveUnread > 0) && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full" style={{ background: "var(--status-critical)" }} />
            )}
          </button>
          {notifOpen && (
            <>
              <div className="absolute right-0 z-20 mt-2 w-80 max-w-[85vw] rounded-xl border border-border-subtle bg-surface-1 p-2 shadow-lg">
                <div className="flex items-center justify-between px-2 py-1.5">
                  <p className="text-sm font-semibold text-ink-primary">Notifications</p>
                  <span className="text-xs text-ink-muted">{notifications.length + liveUnread} new</span>
                </div>
                <div className="max-h-80 space-y-1 overflow-y-auto">
                  {live.map((item) => (
                    <button
                      key={`live-${item.id}`}
                      type="button"
                      onClick={() => openLive(item)}
                      className={`block w-full rounded-lg px-2 py-2 text-left hover:bg-surface-2 ${item.read ? "" : "bg-amber-50/60 dark:bg-amber-900/10"}`}
                    >
                      <p className="flex items-center gap-2 text-sm font-semibold text-ink-primary">
                        {!item.read && <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />}
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-secondary">{item.message}</p>
                      {item.createdAt && <p className="mt-1 text-[11px] text-ink-muted">{formatDateTime(item.createdAt)}</p>}
                    </button>
                  ))}
                  {notifications.length === 0 && live.length === 0 ? (
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

        <div className="relative" ref={profileRef}>
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
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    setPasswordOpen(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-ink-secondary hover:bg-surface-3"
                >
                  Change Password / پاس ورڈ تبدیل کریں
                </button>
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
      {passwordOpen && <ChangePasswordModal onClose={() => setPasswordOpen(false)} />}
    </header>
  );
}
