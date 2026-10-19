"use client";

import { offlineFetch } from "@/lib/offline/outbox";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconBell } from "@/components/icons";
import { useLivePoll } from "@/lib/khata/use-live-poll";
import { formatDateTime } from "@/lib/format";

export interface BellItem {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  href: string;
}

// Notification bell with an unread count. It polls the list every 5 seconds.
// Clicking an item marks it read and opens the exact request it points to.
export function NotificationBell({ listUrl, readUrlBase }: { listUrl: string; readUrlBase: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<BellItem[]>([]);
  const [unread, setUnread] = useState(0);

  useLivePoll(async () => {
    const response = await fetch(listUrl, { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    setItems(Array.isArray(data.items) ? data.items : []);
    setUnread(Number(data.unread) || 0);
  }, 5000);

  async function openItem(item: BellItem) {
    setOpen(false);
    if (!item.read) {
      setItems((list) => list.map((i) => (i.id === item.id ? { ...i, read: true } : i)));
      setUnread((count) => Math.max(0, count - 1));
      await offlineFetch(`${readUrlBase}/${item.id}/read`, { method: "POST", cache: "no-store" }).catch(() => undefined);
    }
    router.push(item.href);
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications / اطلاعات"
        className="relative rounded-lg border border-slate-300 p-2 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <IconBell size={18} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-80 max-w-[90vw] rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <p className="px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white">
              Notifications / اطلاعات {unread > 0 && <span className="text-red-600">({unread} unread)</span>}
            </p>
            {items.length === 0 ? (
              <p className="px-3 py-4 text-sm text-slate-600 dark:text-slate-400">No notifications yet / ابھی کوئی اطلاع نہیں</p>
            ) : (
              <div className="max-h-96 divide-y divide-slate-200 overflow-y-auto dark:divide-slate-700">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openItem(item)}
                    className={`block w-full px-3 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800 ${item.read ? "" : "bg-amber-50/60 dark:bg-amber-900/10"}`}
                  >
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                      {!item.read && <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />}
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">{item.message}</p>
                    {item.createdAt && <p className="mt-1 text-[11px] text-slate-500">{formatDateTime(item.createdAt)}</p>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
