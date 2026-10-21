"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import {
  clearOfflineData,
  discardOutboxItem,
  listOutbox,
  OUTBOX_EVENT,
  refreshScope,
  syncOutbox,
  type OutboxItem,
} from "@/lib/offline/outbox";

const SYNC_INTERVAL_MS = 30_000;
// Sign-in pages clear the offline caches, so a signed-out device keeps no pages or data from the last account.
const SIGN_IN_PAGE = /(^|\/)(login|signup)(\/|$)|^\/auth\//;

function labelFor(url: string): string {
  const path = new URL(url, "http://local").pathname;
  if (path.endsWith("/proof")) return "Payment proof";
  if (path.includes("/shifts/start")) return "Shift start";
  if (path.includes("/shifts/end")) return "Shift end";
  if (path.includes("/khata-entries")) return "Khata entry";
  if (path.includes("/fuel-orders")) return "Fuel order";
  if (path.includes("/sales")) return "Sales entry";
  if (path.includes("/payments")) return "Payment";
  return "Change";
}

function subscribeOnline(onChange: () => void): () => void {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

// Shows the connection and the changes saved on this device. It renders nothing while the device is online with
// nothing waiting, so the normal screens are unchanged.
export function OfflineProvider() {
  const pathname = usePathname();
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
  const [items, setItems] = useState<OutboxItem[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const syncingRef = useRef(false);

  const refreshList = useCallback(async () => {
    try {
      setItems(await listOutbox());
    } catch {
      setItems([]);
    }
  }, []);

  const sync = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);
    try {
      await syncOutbox();
    } catch {
      // Storage may be unavailable; the changes stay as they are and the next attempt tries again.
    } finally {
      syncingRef.current = false;
      setSyncing(false);
      await refreshList();
    }
  }, [refreshList]);

  // Service worker: production only, so development reloads are not served from a cache.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
  }, []);

  // Connection state, sync on return of the connection, on focus, on a timer, and whenever the outbox changes.
  useEffect(() => {
    // sync() ends by reloading the list, so the first load is included.
    void sync();

    const goOnline = () => void sync();
    const visible = () => {
      if (document.visibilityState === "visible") void sync();
    };
    const changed = () => void refreshList();

    window.addEventListener("online", goOnline);
    document.addEventListener("visibilitychange", visible);
    window.addEventListener(OUTBOX_EVENT, changed);
    const timer = window.setInterval(() => void sync(), SYNC_INTERVAL_MS);
    return () => {
      window.removeEventListener("online", goOnline);
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener(OUTBOX_EVENT, changed);
      window.clearInterval(timer);
    };
  }, [refreshList, sync]);

  // Client-side navigation can change the signed-in account without a reload, so the account is checked on each page.
  useEffect(() => {
    if (SIGN_IN_PAGE.test(pathname)) clearOfflineData();
    void refreshScope().then(() => sync());
  }, [pathname, sync]);

  const waiting = items.filter((item) => item.status !== "failed");
  const failed = items.filter((item) => item.status === "failed");
  if (online && waiting.length === 0 && failed.length === 0) return null;

  let message = "You are offline. Changes are saved on this device.";
  if (online && waiting.length > 0) {
    message = syncing ? "Sending saved changes…" : `${waiting.length} saved change${waiting.length === 1 ? "" : "s"} waiting to send`;
  }
  if (failed.length > 0) {
    message = `${failed.length} change${failed.length === 1 ? "" : "s"} need${failed.length === 1 ? "s" : ""} review`;
  }

  const discard = async (item: OutboxItem) => {
    if (!window.confirm(`Discard this ${labelFor(item.url).toLowerCase()}? It will not be saved.`)) return;
    await discardOutboxItem(item.id);
    await refreshList();
  };

  return (
    <div className="fixed bottom-12 right-3 z-[60] flex max-w-[calc(100vw-1.5rem)] flex-col items-end gap-2 text-sm">
      {reviewing && failed.length > 0 && (
        <div role="dialog" aria-label="Changes that need review" className="w-80 max-w-full rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
          <p className="mb-2 font-semibold text-slate-800">Changes the server did not accept</p>
          <ul className="max-h-64 space-y-2 overflow-y-auto">
            {failed.map((item) => (
              <li key={item.id} className="rounded border border-slate-200 p-2">
                <p className="font-medium text-slate-800">{labelFor(item.url)}</p>
                <p className="text-xs text-slate-600">{item.lastError}</p>
                <button
                  type="button"
                  onClick={() => discard(item)}
                  className="mt-1 text-xs font-medium text-rose-700 underline"
                >
                  Discard
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div role="status" className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow">
        <span className={`h-2 w-2 rounded-full ${online ? (failed.length ? "bg-rose-500" : "bg-amber-500") : "bg-slate-400"}`} />
        <span className="text-slate-700">{message}</span>
        {failed.length > 0 && (
          <button type="button" onClick={() => setReviewing((open) => !open)} className="font-medium text-rose-700 underline">
            {reviewing ? "Close" : "Review"}
          </button>
        )}
      </div>
    </div>
  );
}
