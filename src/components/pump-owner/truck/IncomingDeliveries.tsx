"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/Card";
import { CheckCircleIcon, TruckIcon } from "@/components/icons";
import type { IncomingDelivery } from "@/lib/truck/delivery";
import { TRIP_STAGE_LABELS } from "@/lib/truck/gps";
import { TruckMapPanel } from "./TruckMapPanel";

const STAGE_STYLE = {
  accepted: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
  "on-the-way": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  arrived: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
} as const;

function formatTime(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

// Deliveries coming to this pump. The destination owner confirms a delivery here once the truck has arrived.
export function IncomingDeliveries({ items }: { items: IncomingDelivery[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function confirm(orderId: string) {
    setBusy(orderId);
    setError("");
    try {
      const response = await fetch("/api/pump-owner/confirm-delivery", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderId }),
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
      <CardHeader title="Incoming deliveries / آنے والی ترسیلات" subtitle="Confirm a delivery once its truck has arrived / ٹرک پہنچنے پر ترسیل کی تصدیق کریں" />
      <div className="space-y-5 p-5 pt-0">
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</div>}
        {items.length === 0 ? (
          <div className="py-6 text-center">
            <TruckIcon size={28} className="mx-auto text-slate-400" />
            <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">No incoming deliveries / کوئی آنے والی ترسیل نہیں</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.orderId} className="space-y-4 rounded-2xl border border-slate-200 p-4 shadow-sm dark:border-slate-800">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {item.orderNumber} · {item.truckNumber} · {item.driverName}
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {item.fuelType === "diesel" ? "Diesel / ڈیزل" : "Petrol / پیٹرول"} · {item.quantityLitres.toLocaleString()} L · From / سے: {item.pickupCompany}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Expected / متوقع: {formatTime(item.expectedArrival)} {item.arrivedAt ? `· Arrived / پہنچا: ${formatTime(item.arrivedAt)}` : ""}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STAGE_STYLE[item.stage]}`}>
                  {TRIP_STAGE_LABELS[item.stage].en} / {TRIP_STAGE_LABELS[item.stage].ur}
                </span>
              </div>

              <TruckMapPanel src={`/api/pumpadmin/trucks/${item.truckId}/map`} compact />

              {item.stage === "arrived" ? (
                <button
                  type="button"
                  disabled={busy !== ""}
                  onClick={() => confirm(item.orderId)}
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircleIcon size={16} />
                  {busy === item.orderId ? "Confirming… / تصدیق ہو رہی ہے" : "Confirm delivery / ترسیل کی تصدیق کریں"}
                </button>
              ) : item.stage === "completed" ? (
                <p className="text-sm font-medium text-green-700 dark:text-green-400">Delivery confirmed / ترسیل کی تصدیق ہو چکی</p>
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-400">Confirm becomes available when the truck arrives. / ٹرک پہنچنے پر تصدیق ممکن ہوگی۔</p>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
