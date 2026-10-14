"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/Card";
import { CheckCircleIcon, LogOutIcon, XCircleIcon } from "@/components/icons";
import {
  SUPPLIER_ACTION_RULES,
  SUPPLIER_FUEL_LABELS,
  SUPPLIER_STATUS_LABELS,
  type SupplierAction,
  type SupplierRequestStatus,
  type SupplierRequestView,
} from "@/lib/supplier/types";

const STATUS_STYLE: Record<SupplierRequestStatus, string> = {
  sent: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  seen: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
  accepted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

// Button labels in English and Urdu.
const ACTION_LABELS: Record<SupplierAction, string> = {
  seen: "Seen / دیکھ لیا",
  accept: "Accept / قبول کریں",
  reject: "Reject / مسترد کریں",
  deliver: "Mark Delivered / پہنچا دیا",
};

function formatDate(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

// Only this supplier's requests are shown; the server filters them by the signed-in account.
export function SupplierInbox({ name, companyName }: { name: string; companyName: string }) {
  const router = useRouter();
  const [requests, setRequests] = useState<SupplierRequestView[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const response = await fetch("/api/supplier/requests", { cache: "no-store", credentials: "include" });
      if (response.status === 401) {
        router.push("/auth/login");
        return;
      }
      if (!response.ok) return;
      const data = await response.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      // Keep the last list if a refresh fails.
    } finally {
      setLoaded(true);
    }
  }

  // Live updates: the list refreshes in the background every 10 seconds.
  useEffect(() => {
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function act(requestId: string, action: SupplierAction) {
    setBusy(requestId);
    setError("");
    try {
      const response = await fetch(`/api/supplier/requests/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Failed to update the request");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setBusy("");
    }
  }

  async function logout() {
    await fetch("/api/supplier/auth/logout", { method: "POST", credentials: "include" }).catch(() => undefined);
    router.push("/auth/login");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{companyName || name || "Supplier"}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{name}</p>
          <p className="text-xs text-slate-500">Your fuel requests / آپ کی ایندھن کی درخواستیں</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <LogOutIcon size={18} />
          Logout / لاگ آؤٹ
        </button>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</div>}

      <Card>
        <CardHeader title="Requests / درخواستیں" subtitle="Updates every 10 seconds / ہر 10 سیکنڈ بعد تازہ ہوتی ہے" />
        {!loaded ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">Loading... / لوڈ ہو رہا ہے</p>
        ) : requests.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-slate-900 dark:text-white">No requests yet / ابھی کوئی درخواست نہیں</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">New fuel requests from pumps will appear here. / نئی درخواستیں یہاں ظاہر ہوں گی۔</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {requests.map((r) => {
              const actions = (Object.keys(SUPPLIER_ACTION_RULES) as SupplierAction[]).filter((a) =>
                SUPPLIER_ACTION_RULES[a].from.includes(r.status)
              );
              return (
                <div key={r.id} className="space-y-3 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{r.pumpName || "Pump / پمپ"}</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {SUPPLIER_FUEL_LABELS[r.fuelType]?.en ?? "—"} / {SUPPLIER_FUEL_LABELS[r.fuelType]?.ur ?? "—"} · {(r.litres ?? 0).toLocaleString()} L
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Date / تاریخ: {formatDate(r.sentAt)}</p>
                      {r.note && <p className="text-xs text-slate-500">{r.note}</p>}
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[r.status] ?? STATUS_STYLE.sent}`}>
                      {SUPPLIER_STATUS_LABELS[r.status]?.en ?? r.status} / {SUPPLIER_STATUS_LABELS[r.status]?.ur ?? ""}
                    </span>
                  </div>

                  {actions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {actions.map((a) => (
                        <button
                          key={a}
                          type="button"
                          disabled={busy === r.id}
                          onClick={() => act(r.id, a)}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 ${
                            a === "reject" ? "bg-red-600 hover:bg-red-700" : a === "deliver" ? "bg-green-600 hover:bg-green-700" : a === "accept" ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-600 hover:bg-slate-700"
                          }`}
                        >
                          {a === "reject" ? <XCircleIcon size={14} /> : <CheckCircleIcon size={14} />}
                          {ACTION_LABELS[a]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
