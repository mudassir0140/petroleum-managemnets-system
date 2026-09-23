"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { Badge } from "@/components/dashboard/badge";
import { CheckCircleIcon } from "@/components/icons";

interface FuelOrder {
  _id: string;
  pumpId: string;
  pumpName: string;
  fuelType: "petrol" | "diesel";
  quantityLitres: number;
  status: string;
  requestedAt: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  driverName?: string;
  trackingNumber?: string;
  expectedArrival?: string;
  driverConfirmedAt?: string;
  pumpOwnerConfirmedAt?: string;
}

const STATUS_COLORS: Record<string, string> = {
  "on-the-way": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  "delivered": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  "completed": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
};

export default function DriverFuelOrdersPage() {
  const [orders, setOrders] = useState<FuelOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const res = await fetch("/api/driver/fuel-orders", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmDelivery(orderId: string) {
    setConfirmLoading(true);
    setError("");
    try {
      const res = await fetch("/api/driver/confirm-delivery", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to confirm delivery");

      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId ? { ...o, driverConfirmedAt: new Date().toISOString(), status: o.pumpOwnerConfirmedAt ? "completed" : "delivered" } : o
        )
      );
      setConfirming(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setConfirmLoading(false);
    }
  }

  const readyToConfirm = orders.filter((o) => o.status === "on-the-way" || o.status === "delivered");
  const confirmedCount = orders.filter((o) => o.driverConfirmedAt).length;
  const totalLitres = orders.reduce((sum, o) => sum + o.quantityLitres, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My Fuel Deliveries"
          description="View and confirm your assigned fuel deliveries"
        />
        <div className="text-center text-slate-600 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Fuel Deliveries"
        description="View and confirm your assigned fuel deliveries"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SectionCard title="Total Deliveries" description={`${orders.length} assigned`}>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{orders.length}</div>
        </SectionCard>
        <SectionCard title="Ready to Confirm" description="Pending confirmation">
          <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{readyToConfirm.length}</div>
        </SectionCard>
        <SectionCard title="Confirmed" description="Delivery confirmed">
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{confirmedCount}</div>
        </SectionCard>
        <SectionCard title="Total Volume" description="Litres to deliver">
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{totalLitres.toLocaleString()} L</div>
        </SectionCard>
      </div>

      <SectionCard title="My Deliveries" description="All assigned fuel orders">
        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
              {error}
            </div>
          )}

          {orders.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-600 dark:text-slate-400">
              No deliveries assigned yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Pump</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Fuel</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Quantity</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">ETA</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Confirmations</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {orders.map((o) => (
                    <tr key={o._id}>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{o.pumpName}</td>
                      <td className="px-4 py-3 capitalize text-slate-600 dark:text-slate-400">{o.fuelType}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{o.quantityLitres.toLocaleString()} L</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[o.status] || ""}`}>
                          {o.status.replace("-", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                        {o.expectedArrival ? new Date(o.expectedArrival).toLocaleTimeString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="space-y-1">
                          <div className={o.driverConfirmedAt ? "text-green-600" : "text-slate-400"}>
                            ✓ You {o.driverConfirmedAt ? "(confirmed)" : ""}
                          </div>
                          <div className={o.pumpOwnerConfirmedAt ? "text-green-600" : "text-slate-400"}>
                            ✓ Owner {o.pumpOwnerConfirmedAt ? "(confirmed)" : ""}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {(o.status === "on-the-way" || o.status === "delivered") && !o.driverConfirmedAt && (
                          <button
                            onClick={() => setConfirming(o._id)}
                            className="text-xs font-medium text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
                          >
                            Confirm
                          </button>
                        )}
                        {o.driverConfirmedAt && (
                          <span className="text-xs text-green-600 dark:text-green-400">✓ Confirmed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </SectionCard>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-slate-800">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="size-6 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Confirm Delivery</h3>
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Confirm that you have delivered the fuel to the pump. This must be confirmed by both you and the pump owner.
            </p>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setConfirming(null)}
                disabled={confirmLoading}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmDelivery(confirming)}
                disabled={confirmLoading}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600"
              >
                {confirmLoading ? "Confirming..." : "Confirm Delivery"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
