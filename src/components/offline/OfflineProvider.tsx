"use client";

// Registers the offline cache, runs the outbox sync, and shows a small status pill only when the app is offline or
// changes are waiting. Nothing is shown while everything is synced, so the layout is unchanged.
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useLivePoll } from "@/lib/khata/use-live-poll";
import { listOutbox, OUTBOX_EVENT, syncOutbox } from "@/lib/offline/outbox";

// Every sign-in page. Visiting one means the user is signed out (sign-out ends on a login page), so the cached pages
// and data are removed. A shared computer then cannot show the last user's pages.
const LOGIN_PATH = /^\/(auth\/login|login|developer|pump-owner\/login|khata-client\/login)(\/|$)/;

export function OfflineProvider() {
  const pathname = usePathname();
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [failed, setFailed] = useState(0);

  // Register the service worker in production only, so development builds are never served from the cache.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    // updateViaCache "none": the browser checks /sw.js itself on every visit, so a new deployment's worker is picked up.
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then(() => navigator.serviceWorker.ready)
      .then(() => {
        // The first visit is not under the worker control yet, so its pages would not be kept. Reload once so this
        // page and every later one are kept for offline use.
        if (navigator.serviceWorker.controller || sessionStorage.getItem("pms-sw-reload")) return;
        sessionStorage.setItem("pms-sw-reload", "1");
        window.location.reload();
      })
      .catch(() => undefined);
  }, []);

  // On a sign-in page, drop the cached pages and data from the last session.
  useEffect(() => {
    if (!LOGIN_PATH.test(pathname)) return;
    navigator.serviceWorker?.controller?.postMessage({ type: "clear-caches" });
  }, [pathname]);

  async function refresh() {
    const items = await listOutbox();
    setPending(items.filter((i) => i.status !== "failed").length);
    setFailed(items.filter((i) => i.status === "failed").length);
    setOnline(navigator.onLine);
  }

  // Refresh the counts on every change, and send the queue again when the connection returns.
  useLivePoll(refresh, 4000);
  useLivePoll(syncOutbox, 20_000);

  useEffect(() => {
    const onChange = () => void refresh();
    const onConnection = () => {
      setOnline(navigator.onLine);
      if (navigator.onLine) void syncOutbox().then(refresh);
    };
    window.addEventListener(OUTBOX_EVENT, onChange);
    window.addEventListener("online", onConnection);
    window.addEventListener("offline", onConnection);
    return () => {
      window.removeEventListener(OUTBOX_EVENT, onChange);
      window.removeEventListener("online", onConnection);
      window.removeEventListener("offline", onConnection);
    };
  }, []);

  if (online && pending === 0 && failed === 0) return null;

  const message = !online
    ? `Offline. ${pending} change${pending === 1 ? "" : "s"} saved on this device.`
    : failed > 0
      ? `${failed} change${failed === 1 ? "" : "s"} could not be saved. Check the Khata page.`
      : `Syncing ${pending} change${pending === 1 ? "" : "s"}…`;

  return (
    <div
      role="status"
      className={`fixed bottom-3 right-3 z-50 max-w-xs rounded-lg px-3 py-2 text-xs font-medium shadow-lg ${
        failed > 0 ? "bg-red-600 text-white" : online ? "bg-amber-500 text-white" : "bg-slate-800 text-white"
      }`}
    >
      {message}
    </div>
  );
}
