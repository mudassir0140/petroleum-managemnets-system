"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/Card";
import { CheckCircleIcon, TruckIcon } from "@/components/icons";
import { SUPPLIER_FUEL_LABELS, type SupplierFuelType, type SupplierRequestView } from "@/lib/supplier/types";
import { STAGE_LABELS, requestStage } from "@/lib/supplier/fuel-workflow";
import { TruckMapPanel } from "./TruckMapPanel";

const STAGE_STYLE = {
  requested: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
  processing: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  "on-the-way": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  arrived: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
} as const;

function when(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function km(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? `${value.toLocaleString()} km` : "—";
}

// Fuel requests on the pump's trucks. Each one shows its supplier, truck and driver, its stage, the live
// map and the timestamps. The pump owner confirms a delivery once it has arrived.
export function FuelDeliveries({ items }: { items: SupplierRequestView[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function confirm(id: string) {
    setBusy(id);
    setError("");
    try {
      const response = await fetch(`/api/pumpadmin/supplier-requests/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "confirm" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof data?.error === "string" ? data.error : "Could not confirm the delivery");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy("");
    }
  }

  return (
    <Card>
      <CardHeader title="Fuel deliveries / ایندھن کی ترسیلات" subtitle="Requests on your trucks, with live position / آپ کے ٹرکوں کی درخواستیں، لائیو مقام کے ساتھ" />
      <div className="space-y-5 p-5 pt-0">
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</div>}
        {items.length === 0 ? (
          <div className="py-6 text-center">
            <TruckIcon size={28} className="mx-auto text-slate-400" />
            <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">No fuel deliveries / کوئی ایندھن کی ترسیل نہیں</p>
          </div>
        ) : (
          items.map((r) => {
            const stage = requestStage(r.status);
            const fuel = SUPPLIER_FUEL_LABELS[r.fuelType as SupplierFuelType];
            const canConfirm = r.status === "arrived" && !r.pumpOwnerConfirmedAt;
            return (
              <div key={r.id} className="space-y-4 rounded-2xl border border-slate-200 p-4 shadow-sm dark:border-slate-800">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {r.supplierName || "Supplier / سپلائر"} → {r.pumpName || "Pump / پمپ"}
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {fuel ? `${fuel.en} / ${fuel.ur}` : "—"} · {r.litres.toLocaleString()} L · Truck / ٹرک: {r.truckNumber || "—"} · Driver / ڈرائیور: {r.driverName || "—"}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Sent {when(r.sentAt)} · Dispatched {when(r.dispatchedAt)} · Arrived {when(r.arrivedAt)} {r.arrivalSource ? `(${r.arrivalSource === "gps" ? "GPS" : "driver"})` : ""}
                    </p>
                  </div>
                  {stage && (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STAGE_STYLE[stage]}`}>
                      {STAGE_LABELS[stage].en} / {STAGE_LABELS[stage].ur}
                    </span>
                  )}
                </div>

                <TruckMapPanel src={`/api/fuel-requests/${r.id}/live`} compact />

                <div className="grid grid-cols-1 gap-2 text-xs text-slate-700 dark:text-slate-300 sm:grid-cols-2">
                  <p>Supplier confirmed / سپلائر کی تصدیق: {r.supplierConfirmedAt ? when(r.supplierConfirmedAt) : "not yet"}</p>
                  <p>Pump owner confirmed / مالک کی تصدیق: {r.pumpOwnerConfirmedAt ? when(r.pumpOwnerConfirmedAt) : "not yet"}</p>
                  <p>Travelled / طے شدہ: {km(r.travelledKm)}</p>
                  {r.completedAt && <p>Completed / مکمل: {when(r.completedAt)}</p>}
                </div>

                {canConfirm ? (
                  <button
                    type="button"
                    disabled={busy !== ""}
                    onClick={() => confirm(r.id)}
                    className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircleIcon size={16} />
                    {busy === r.id ? "Confirming… / تصدیق ہو رہی ہے" : "Confirm delivery / ترسیل کی تصدیق کریں"}
                  </button>
                ) : r.status === "arrived" ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400">You have confirmed. Waiting for the supplier. / آپ نے تصدیق کر دی۔ سپلائر کا انتظار۔</p>
                ) : r.status === "completed" ? (
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">Delivery completed by both sides / دونوں طرف سے ترسیل مکمل</p>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
