"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { CheckCircleIcon, XCircleIcon } from "@/components/icons";
import { SUPPLIER_FUEL_LABELS, type SupplierFuelType, type SupplierRequestView } from "@/lib/supplier/types";

// Money and litres: a missing value shows a dash, never 0 and never a crash.
function money(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? `PKR ${value.toLocaleString("en-PK", { maximumFractionDigits: 2 })}` : "—";
}

function litres(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? `${value.toLocaleString()} L` : "—";
}

function formatDate(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

// Requests for this driver's truck that wait for Accept or Reject. Refreshes every 10 seconds.
export function SupplierRequestsPanel() {
  const [requests, setRequests] = useState<SupplierRequestView[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const response = await fetch("/api/truck/supplier-requests", { cache: "no-store", credentials: "include" });
      if (!response.ok) return;
      const data = await response.json();
      if (Array.isArray(data)) setRequests(data);
    } catch {
      // Keep the last list if a refresh fails.
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, []);

  async function answer(id: string, action: "accept" | "reject") {
    setBusy(`${action}:${id}`);
    setError("");
    try {
      const response = await fetch(`/api/truck/supplier-requests/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) setError(typeof data?.error === "string" ? data.error : "Something went wrong");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy("");
      await load();
    }
  }

  return (
    <Card>
      <CardHeader title="Fuel requests for your truck / آپ کے ٹرک کی ایندھن درخواستیں" subtitle="Accept or reject each request / ہر درخواست قبول یا مسترد کریں" />
      <div className="space-y-4 p-5">
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</div>}
        {!loaded ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">Loading... / لوڈ ہو رہا ہے</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">No requests waiting for you / آپ کے لیے کوئی درخواست نہیں</p>
        ) : (
          requests.map((r) => (
            <div key={r.id} className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{r.pumpName || "Pump / پمپ"}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {SUPPLIER_FUEL_LABELS[r.fuelType as SupplierFuelType]?.en ?? "—"} / {SUPPLIER_FUEL_LABELS[r.fuelType as SupplierFuelType]?.ur ?? "—"} · {litres(r.litres)}
                  </p>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">{formatDate(r.sentAt)}</p>
              </div>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-xs text-slate-500">Market rate / مارکیٹ ریٹ</dt>
                  <dd className="font-medium text-slate-900 dark:text-white">{money(r.marketRate)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Offered rate / پیش کردہ ریٹ</dt>
                  <dd className="font-medium text-slate-900 dark:text-white">{money(r.offeredRate)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Advance / پیشگی رقم</dt>
                  <dd className="font-medium text-slate-900 dark:text-white">{money(r.requestAdvance)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Amount / رقم</dt>
                  <dd className="font-medium text-slate-900 dark:text-white">{money(r.amount)}</dd>
                </div>
              </dl>

              {r.note && <p className="text-xs text-slate-600 dark:text-slate-400">Note / نوٹ: {r.note}</p>}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy !== ""}
                  onClick={() => answer(r.id, "accept")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <CheckCircleIcon size={16} />
                  {busy === `accept:${r.id}` ? "Accepting... / قبول ہو رہا ہے" : "Accept / قبول کریں"}
                </button>
                <button
                  type="button"
                  disabled={busy !== ""}
                  onClick={() => answer(r.id, "reject")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  <XCircleIcon size={16} />
                  {busy === `reject:${r.id}` ? "Rejecting... / مسترد ہو رہا ہے" : "Reject / مسترد کریں"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
