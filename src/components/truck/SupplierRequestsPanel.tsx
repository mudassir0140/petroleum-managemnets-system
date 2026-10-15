"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { CheckCircleIcon, XCircleIcon } from "@/components/icons";
import { TruckMapPanel } from "@/components/pump-owner/truck/TruckMapPanel";
import { SUPPLIER_FUEL_LABELS, SUPPLIER_STATUS_LABELS, type SupplierFuelType, type SupplierRequestView } from "@/lib/supplier/types";

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

function fuelLabel(fuel: string): string {
  const f = SUPPLIER_FUEL_LABELS[fuel as SupplierFuelType];
  return f ? `${f.en} / ${f.ur}` : "—";
}

// The requests for this driver's own truck: new ones to accept or reject, and deliveries in progress
// with the arrival button for when GPS cannot detect the arrival. Refreshes every 10 seconds.
export function SupplierRequestsPanel() {
  const [pending, setPending] = useState<SupplierRequestView[]>([]);
  const [active, setActive] = useState<SupplierRequestView[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  // The loader lives in the effect; actions reach it through reloadRef.
  const reloadRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
  async function load() {
    try {
      const response = await fetch("/api/truck/supplier-requests", { cache: "no-store", credentials: "include" });
      if (!response.ok) return;
      const data = await response.json();
      if (Array.isArray(data?.pending)) setPending(data.pending);
      if (Array.isArray(data?.active)) setActive(data.active);
    } catch {
      // Keep the last lists if a refresh fails.
    } finally {
      setLoaded(true);
    }
  }
    reloadRef.current = load;
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, []);

  async function act(id: string, action: "accept" | "reject" | "arrive") {
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
      await reloadRef.current();
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="New fuel requests / نئی ایندھن درخواستیں" subtitle="Accept or reject each request for your truck / اپنے ٹرک کی ہر درخواست قبول یا مسترد کریں" />
        <div className="space-y-4 p-5">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</div>}
          {!loaded ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">Loading... / لوڈ ہو رہا ہے</p>
          ) : pending.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">No requests waiting for you / آپ کے لیے کوئی درخواست نہیں</p>
          ) : (
            pending.map((r) => (
              <div key={r.id} className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{r.pumpName || "Pump / پمپ"}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Supplier / سپلائر: {r.supplierName || "—"} · {fuelLabel(r.fuelType)} · {litres(r.litres)}
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
                    onClick={() => act(r.id, "accept")}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <CheckCircleIcon size={16} />
                    {busy === `accept:${r.id}` ? "Accepting... / قبول ہو رہا ہے" : "Accept / قبول کریں"}
                  </button>
                  <button
                    type="button"
                    disabled={busy !== ""}
                    onClick={() => act(r.id, "reject")}
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

      {active.length > 0 && (
        <Card>
          <CardHeader title="Your deliveries / آپ کی ترسیلات" subtitle="Live position and distances / لائیو مقام اور فاصلے" />
          <div className="space-y-5 p-5 pt-0">
            {active.map((r) => (
              <div key={r.id} className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {r.pumpName || "Pump / پمپ"} · {r.supplierName || "Supplier / سپلائر"}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {fuelLabel(r.fuelType)} · {litres(r.litres)} · Truck / ٹرک: {r.truckNumber || "—"} · Driver / ڈرائیور: {r.driverName || "—"}
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                    {SUPPLIER_STATUS_LABELS[r.status]?.en ?? r.status}
                  </span>
                </div>
                <TruckMapPanel src={`/api/fuel-requests/${r.id}/live`} />
                {r.status === "on-the-way" && (
                  <button
                    type="button"
                    disabled={busy !== ""}
                    onClick={() => act(r.id, "arrive")}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    {busy === `arrive:${r.id}` ? "Sending... / بھیجا جا رہا ہے" : "I have arrived (if GPS did not detect it) / پہنچ گیا"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
