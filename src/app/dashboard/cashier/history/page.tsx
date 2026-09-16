// @ts-nocheck
"use client";

import { Badge } from "@/components/dashboard/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatCurrency } from "@/lib/dashboard/format";
import { useCashierShift } from "@/lib/store/use-cashier-shift";

export default function CashierHistoryPage() {
  const { shifts, transactions } = useCashierShift();
  const closedShifts = shifts.filter((s) => s.status === "closed");
  const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Shift History" description="Your past shifts and every transaction you've logged." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Shifts completed" value={String(closedShifts.length)} />
        <StatCard label="Transactions logged" value={String(transactions.length)} />
        <StatCard label="Total revenue" value={formatCurrency(totalRevenue)} />
      </div>

      <SectionCard title="Shift attendance log">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Shift</th>
                <th className="px-5 py-3 font-medium">Started</th>
                <th className="px-5 py-3 font-medium">Ended</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {shifts.map((shift) => (
                <tr key={shift.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{shift.id}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {new Date(shift.startedAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {shift.endedAt ? new Date(shift.endedAt).toLocaleString() : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <Badge>{shift.status}</Badge>
                  </td>
                </tr>
              ))}
              {shifts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No shifts recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Transaction history">
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
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {new Date(tx.recordedAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 capitalize text-slate-600 dark:text-slate-300">{tx.category}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{tx.description}</td>
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{formatCurrency(tx.amount)}</td>
                  <td className="px-5 py-3">
                    <Badge tone={tx.paymentMethod === "cash" ? "success" : "info"}>{tx.paymentMethod}</Badge>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No transactions recorded yet.
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
