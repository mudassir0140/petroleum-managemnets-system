"use client";

import { useState } from "react";

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

export function ManagerFuelOrdersClient({ initialOrders }: { initialOrders: FuelOrder[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const statusGroups = {
    pending: orders.filter((o) => o.status === "pending"),
    accepted: orders.filter((o) => o.status === "accepted"),
    "on-the-way": orders.filter((o) => o.status === "on-the-way"),
    delivered: orders.filter((o) => o.status === "delivered"),
    completed: orders.filter((o) => o.status === "completed"),
  };

  async function handleMarkOnTheWay(order: FuelOrder) {
    if (order.status !== "accepted") {
      setError("Order must be in 'accepted' status to mark as on the way");
      return;
    }

    setUpdating(order._id);
    setError("");
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          orderId: order._id,
          status: "on-the-way",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update order");

      setOrders((prev) =>
        prev.map((o) =>
          o._id === order._id ? { ...o, status: "on-the-way" } : o
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setUpdating(null);
    }
  }

  function renderOrdersGroup(groupName: string, groupOrders: FuelOrder[]) {
    if (groupOrders.length === 0) return null;

    return (
      <div key={groupName} className="mb-6">
        <h3 className="mb-3 font-semibold text-slate-900 dark:text-white">
          {groupName.charAt(0).toUpperCase() + groupName.slice(1).replace("-", " ")} ({groupOrders.length})
        </h3>
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Pump</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Fuel</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Qty</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Driver</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">ETA</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Confirmations</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {groupOrders.map((o) => (
                <tr key={o._id}>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{o.pumpName}</td>
                  <td className="px-4 py-3 capitalize text-slate-600 dark:text-slate-400">{o.fuelType}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{o.quantityLitres.toLocaleString()} L</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[o.status] || ""}`}>
                      {o.status.replace("-", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{o.driverName || "—"}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                    {o.expectedArrival ? new Date(o.expectedArrival).toLocaleTimeString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div className="space-y-1">
                      <div className={o.driverConfirmedAt ? "text-green-600" : "text-slate-400"}>✓ Driver</div>
                      <div className={o.pumpOwnerConfirmedAt ? "text-green-600" : "text-slate-400"}>✓ Owner</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {o.status === "accepted" && (
                      <button
                        onClick={() => handleMarkOnTheWay(o)}
                        disabled={updating === o._id}
                        className="text-xs font-medium text-cyan-600 hover:text-cyan-800 disabled:opacity-50 dark:text-cyan-400 dark:hover:text-cyan-300"
                      >
                        {updating === o._id ? "Updating..." : "Mark on the way"}
                      </button>
                    )}
                    {o.status !== "accepted" && o.status !== "on-the-way" && (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-600 dark:text-slate-400">No orders</div>
      ) : (
        <>
          {renderOrdersGroup("pending", statusGroups.pending)}
          {renderOrdersGroup("accepted", statusGroups.accepted)}
          {renderOrdersGroup("on-the-way", statusGroups["on-the-way"])}
          {renderOrdersGroup("delivered", statusGroups.delivered)}
          {renderOrdersGroup("completed", statusGroups.completed)}
        </>
      )}
    </div>
  );
}
