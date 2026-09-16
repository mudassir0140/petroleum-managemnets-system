// @ts-nocheck
"use client";

import { useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import {
  TRANSACTION_CATEGORIES,
  type PaymentMethod,
  type TransactionCategory,
} from "@/lib/dashboard/data/cashier";
import { formatCurrency } from "@/lib/dashboard/format";
import { useCashierShift } from "@/lib/store/use-cashier-shift";
import type { CashierSession } from "@/lib/cashier/types";

export function CollectPaymentClient({ session }: { session: CashierSession }) {
  const { activeShift, shiftTransactions, recordTransaction } = useCashierShift(session.cashierId, session.pumpId);
  const [category, setCategory] = useState<TransactionCategory>("fuel");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const amountNum = Number(amount) || 0;
    if (amountNum <= 0) return;
    recordTransaction(category, description, amountNum, paymentMethod);
    setDescription("");
    setAmount("");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Collect Payment" description="Log every transaction as it happens at the counter." />

      {!activeShift ? (
        <SectionCard>
          <div className="p-8 text-center">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">No active shift</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Start your shift from the Overview page before collecting payments.
            </p>
          </div>
        </SectionCard>
      ) : (
        <SectionCard title="New transaction">
          <form className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {TRANSACTION_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Fuel, Snacks"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Amount (Rs.)</label>
              <input
                required
                type="number"
                min={0.01}
                step={0.01}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 500"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Payment method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <button
                type="submit"
                className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
              >
                Log Transaction
              </button>
            </div>
          </form>
        </SectionCard>
      )}

      <SectionCard title="Today's transactions">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Time</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Description</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {shiftTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {new Date(tx.recordedAt).toLocaleTimeString()}
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{tx.category}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{tx.description}</td>
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{formatCurrency(tx.amount)}</td>
                  <td className="px-5 py-3">
                    <Badge tone={tx.paymentMethod === "cash" ? "success" : "info"}>{tx.paymentMethod}</Badge>
                  </td>
                </tr>
              ))}
              {shiftTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No transactions logged yet this shift.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
