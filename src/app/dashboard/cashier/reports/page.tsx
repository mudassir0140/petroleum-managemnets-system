"use client";

import { Badge } from "@/components/dashboard/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import { formatCurrency } from "@/lib/dashboard/format";
import { useCashierShift } from "@/lib/store/use-cashier-shift";

function last30Days(dateIso: string) {
  const days = (Date.now() - new Date(dateIso).getTime()) / (1000 * 60 * 60 * 24);
  return days <= 30;
}

function varianceTone(variance: number): "success" | "warning" | "danger" {
  if (variance === 0) return "success";
  return variance > 0 ? "warning" : "danger";
}

export default function CashierReportsPage() {
  const { transactions, handovers } = useCashierShift();
  const recentTx = transactions.filter((t) => last30Days(t.recordedAt));
  const revenueLast30 = recentTx.reduce((sum, t) => sum + t.amount, 0);
  const cashLast30 = recentTx.filter((t) => t.paymentMethod === "cash").reduce((sum, t) => sum + t.amount, 0);

  const dailySummary = Object.values(
    recentTx.reduce<Record<string, { date: string; cash: number; card: number }>>((acc, tx) => {
      const date = tx.recordedAt.slice(0, 10);
      acc[date] ??= { date, cash: 0, card: 0 };
      acc[date][tx.paymentMethod] += tx.amount;
      return acc;
    }, {}),
  ).sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="space-y-6">
      <PageHeader title="Cash Reports" description="Daily cash summaries and shift-handover reconciliation." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Revenue — last 30 days" value={formatCurrency(revenueLast30)} />
        <StatCard label="Cash — last 30 days" value={formatCurrency(cashLast30)} />
        <StatCard label="Handovers submitted" value={String(handovers.length)} />
      </div>

      <SectionCard
        title="Daily cash summary"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv(
                "daily-cash-summary",
                dailySummary.map((d) => ({ Date: d.date, Cash: d.cash, Card: d.card })),
              )
            }
          />
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Cash</th>
                <th className="px-5 py-3 font-medium">Card</th>
                <th className="px-5 py-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {dailySummary.map((day) => (
                <tr key={day.date} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{day.date}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatCurrency(day.cash)}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatCurrency(day.card)}</td>
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                    {formatCurrency(day.cash + day.card)}
                  </td>
                </tr>
              ))}
              {dailySummary.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No transactions in the last 30 days.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Shift handovers & reconciliation">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Submitted</th>
                <th className="px-5 py-3 font-medium">Handed to</th>
                <th className="px-5 py-3 font-medium">Revenue</th>
                <th className="px-5 py-3 font-medium">Cash counted</th>
                <th className="px-5 py-3 font-medium">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {handovers.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {new Date(h.submittedAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{h.handoverTo}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatCurrency(h.revenueTotal)}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatCurrency(h.cashCounted)}</td>
                  <td className="px-5 py-3">
                    <Badge tone={varianceTone(h.variance)}>
                      {h.variance === 0 ? "Exact" : formatCurrency(h.variance)}
                    </Badge>
                  </td>
                </tr>
              ))}
              {handovers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No handovers submitted yet.
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
