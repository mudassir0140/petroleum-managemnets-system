"use client";

import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";

interface FuelOrder {
  _id: string;
  pumpId: string;
  pumpName: string;
  fuelType: "petrol" | "diesel";
  quantityLitres: number;
  status: "pending" | "accepted" | "on-the-way" | "dispatched" | "delivered" | "completed" | "payment-pending" | "paid" | "cleared";
  requestedAt: string;
  acceptedAt?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  driverName?: string;
  trackingNumber?: string;
  expectedArrival?: string;
  driverConfirmedAt?: string;
  pumpOwnerConfirmedAt?: string;
  totalAmount?: number;
  notes?: string;
}

const STATUS_COLORS: Record<FuelOrder["status"], string> = {
  "pending": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  "accepted": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "on-the-way": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  "dispatched": "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
  "delivered": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  "completed": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  "payment-pending": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  "paid": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "cleared": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
};

export function FuelOrdersList({ orders, onRefresh }: { orders: FuelOrder[]; onRefresh?: () => void }) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirmDelivery(orderId: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/pump-owner/confirm-delivery", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to confirm delivery");

      setConfirming(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Order History" subtitle="Track your fuel requests and deliveries" />
      {error && (
        <div className="mx-5 mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}
      <div className="overflow-x-auto">
        {orders.length === 0 ? (
          <div className="px-6 py-8 text-center text-slate-600 dark:text-slate-400">
            No fuel orders yet
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Fuel</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Quantity</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Driver</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">ETA</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Confirmations</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Requested</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {orders.map((o) => (
                <tr key={o._id}>
                  <td className="px-6 py-3 capitalize font-medium text-slate-900 dark:text-white">
                    {o.fuelType}
                  </td>
                  <td className="px-6 py-3 text-slate-600 dark:text-slate-400">
                    {o.quantityLitres.toLocaleString()} L
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[o.status]}`}>
                      {o.status.replace("-", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-600 dark:text-slate-400">
                    {o.driverName ? (
                      <div>
                        <p className="font-medium">{o.driverName}</p>
                        {o.trackingNumber && <p className="text-xs text-slate-500 dark:text-slate-500">{o.trackingNumber}</p>}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-6 py-3 text-slate-600 dark:text-slate-400">
                    {o.expectedArrival ? new Date(o.expectedArrival).toLocaleTimeString() : "—"}
                  </td>
                  <td className="px-6 py-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <span className={o.driverConfirmedAt ? "text-green-600" : "text-slate-400"}>✓ Driver</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={o.pumpOwnerConfirmedAt ? "text-green-600" : "text-slate-400"}>✓ You</span>
                      </div>
                      {(o.status === "on-the-way" || o.status === "delivered") && !o.pumpOwnerConfirmedAt && (
                        <button
                          onClick={() => setConfirming(o._id)}
                          disabled={loading}
                          className="mt-1 text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 dark:text-blue-400"
                        >
                          Confirm
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-slate-600 dark:text-slate-400">
                    {new Date(o.requestedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-slate-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Confirm Delivery</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Confirming that you have received the fuel delivery. This must be confirmed by both you and the driver.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setConfirming(null)}
                disabled={loading}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmDelivery(confirming)}
                disabled={loading}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 dark:bg-green-500 dark:hover:bg-green-600"
              >
                {loading ? "Confirming..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
