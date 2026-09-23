"use client";

import { useState } from "react";

interface Order {
  _id: string;
  pumpId: string;
  pumpName: string;
  fuelType: "petrol" | "diesel";
  quantityLitres: number;
  status: "pending" | "dispatched" | "delivered";
  notes?: string;
  requestedAt: string;
  dispatchedAt?: string;
  deliveredAt?: string;
}

const STATUS_TONE: Record<Order["status"], string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  dispatched: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
  delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
};

const NEXT_STATUS: Record<Order["status"], Order["status"] | null> = {
  pending: "dispatched",
  dispatched: "delivered",
  delivered: null,
};

export function OrdersManager({
  initialOrders,
  pumps,
}: {
  initialOrders: Order[];
  pumps: { id: string; name: string }[];
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    pumpId: pumps[0]?.id ?? "",
    fuelType: "petrol" as "petrol" | "diesel",
    quantityLitres: "",
    notes: "",
  });

  async function refresh() {
    const res = await fetch("/api/admin/orders", { credentials: "include" });
    const data = await res.json();
    if (res.ok && data.success) setOrders(data.orders);
  }

  async function handleAdvanceStatus(order: Order) {
    const nextStatus = NEXT_STATUS[order.status];
    if (!nextStatus) return;
    setError("");
    const res = await fetch("/api/admin/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ orderId: order._id, status: nextStatus }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to update order");
      return;
    }
    await refresh();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const quantity = Number(form.quantityLitres);
    if (!form.pumpId) {
      setError("Select a pump");
      return;
    }
    if (!quantity || quantity <= 0) {
      setError("Enter a valid quantity");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          pumpId: form.pumpId,
          fuelType: form.fuelType,
          quantityLitres: quantity,
          notes: form.notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create order");

      setForm({ pumpId: pumps[0]?.id ?? "", fuelType: "petrol", quantityLitres: "", notes: "" });
      setShowForm(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowForm((v) => !v)}
        className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
      >
        {showForm ? "Cancel" : "+ New Order"}
      </button>

      {showForm && (
        <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 p-4 dark:border-slate-700 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Pump</label>
            <select
              value={form.pumpId}
              onChange={(e) => setForm({ ...form, pumpId: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {pumps.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Fuel Type</label>
            <select
              value={form.fuelType}
              onChange={(e) => setForm({ ...form, fuelType: e.target.value as "petrol" | "diesel" })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="petrol">Petrol</option>
              <option value="diesel">Diesel</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Quantity (L)</label>
            <input
              type="number"
              min="1"
              value={form.quantityLitres}
              onChange={(e) => setForm({ ...form, quantityLitres: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={creating || pumps.length === 0}
              className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-amber-500 dark:text-slate-950"
            >
              {creating ? "Creating..." : "Create Order"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        {orders.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-600 dark:text-slate-400">No orders yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="py-2 text-left font-semibold text-slate-900 dark:text-white">Pump</th>
                <th className="py-2 text-left font-semibold text-slate-900 dark:text-white">Fuel</th>
                <th className="py-2 text-left font-semibold text-slate-900 dark:text-white">Quantity</th>
                <th className="py-2 text-left font-semibold text-slate-900 dark:text-white">Status</th>
                <th className="py-2 text-left font-semibold text-slate-900 dark:text-white">Requested</th>
                <th className="py-2 text-left font-semibold text-slate-900 dark:text-white">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {orders.map((o) => (
                <tr key={o._id}>
                  <td className="py-2.5 font-medium text-slate-900 dark:text-white">{o.pumpName}</td>
                  <td className="py-2.5 capitalize text-slate-600 dark:text-slate-400">{o.fuelType}</td>
                  <td className="py-2.5 text-slate-600 dark:text-slate-400">{o.quantityLitres.toLocaleString()} L</td>
                  <td className="py-2.5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_TONE[o.status]}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-600 dark:text-slate-400">
                    {new Date(o.requestedAt).toLocaleDateString()}
                  </td>
                  <td className="py-2.5">
                    {NEXT_STATUS[o.status] ? (
                      <button
                        onClick={() => handleAdvanceStatus(o)}
                        className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
                      >
                        Mark {NEXT_STATUS[o.status]}
                      </button>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
