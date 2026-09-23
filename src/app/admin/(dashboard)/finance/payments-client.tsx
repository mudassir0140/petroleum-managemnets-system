"use client";

import { useState } from "react";

interface Payment {
  _id: string;
  pumpId: string;
  pumpName: string;
  amountDue: number;
  amountPaid: number;
  status: "paid" | "pending";
  dueDate: string;
  paidAt?: string;
  notes?: string;
}

function computeDisplayStatus(p: Payment): "paid" | "pending" | "overdue" {
  if (p.status === "paid") return "paid";
  return new Date(p.dueDate).getTime() < Date.now() ? "overdue" : "pending";
}

const STATUS_TONE: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  overdue: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
};

export function PaymentsManager({
  initialPayments,
  pumps,
}: {
  initialPayments: Payment[];
  pumps: { id: string; name: string }[];
}) {
  const [payments, setPayments] = useState(initialPayments);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    pumpId: pumps[0]?.id ?? "",
    amountDue: "",
    dueDate: "",
    notes: "",
  });

  async function refresh() {
    const res = await fetch("/api/admin/payments", { credentials: "include" });
    const data = await res.json();
    if (res.ok && data.success) setPayments(data.payments);
  }

  async function handleMarkPaid(payment: Payment) {
    setError("");
    const res = await fetch("/api/admin/payments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ paymentId: payment._id, amountPaid: payment.amountDue }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to update payment");
      return;
    }
    await refresh();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const amount = Number(form.amountDue);
    if (!form.pumpId) {
      setError("Select a pump");
      return;
    }
    if (!amount || amount <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (!form.dueDate) {
      setError("Select a due date");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          pumpId: form.pumpId,
          amountDue: amount,
          dueDate: form.dueDate,
          notes: form.notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create payment");

      setForm({ pumpId: pumps[0]?.id ?? "", amountDue: "", dueDate: "", notes: "" });
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
        {showForm ? "Cancel" : "+ New Payment Record"}
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
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Amount Due (Rs.)</label>
            <input
              type="number"
              min="1"
              value={form.amountDue}
              onChange={(e) => setForm({ ...form, amountDue: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Due Date</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={creating || pumps.length === 0}
              className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-amber-500 dark:text-slate-950"
            >
              {creating ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        {payments.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-600 dark:text-slate-400">No payment records yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="py-2 text-left font-semibold text-slate-900 dark:text-white">Pump</th>
                <th className="py-2 text-left font-semibold text-slate-900 dark:text-white">Amount Due</th>
                <th className="py-2 text-left font-semibold text-slate-900 dark:text-white">Due Date</th>
                <th className="py-2 text-left font-semibold text-slate-900 dark:text-white">Status</th>
                <th className="py-2 text-left font-semibold text-slate-900 dark:text-white">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {payments.map((p) => {
                const displayStatus = computeDisplayStatus(p);
                return (
                  <tr key={p._id}>
                    <td className="py-2.5 font-medium text-slate-900 dark:text-white">{p.pumpName}</td>
                    <td className="py-2.5 text-slate-600 dark:text-slate-400">Rs. {p.amountDue.toLocaleString()}</td>
                    <td className="py-2.5 text-slate-600 dark:text-slate-400">
                      {new Date(p.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-2.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_TONE[displayStatus]}`}>
                        {displayStatus}
                      </span>
                    </td>
                    <td className="py-2.5">
                      {p.status === "pending" ? (
                        <button
                          onClick={() => handleMarkPaid(p)}
                          className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
                        >
                          Mark Paid
                        </button>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">
                          Paid {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : ""}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
