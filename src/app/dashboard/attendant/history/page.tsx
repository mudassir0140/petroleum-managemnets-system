// @ts-nocheck
"use client";

import { Badge } from "@/components/dashboard/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatCurrency, formatLiters } from "@/lib/dashboard/format";
import { useAttendantShift } from "@/lib/store/use-attendant-shift";

function last30Days(dateIso: string) {
  const days = (Date.now() - new Date(dateIso).getTime()) / (1000 * 60 * 60 * 24);
  return days <= 30;
}

function varianceTone(variance: number): "success" | "warning" | "danger" {
  if (variance === 0) return "success";
  return variance > 0 ? "warning" : "danger";
}

export default function AttendantHistoryPage() {
  const { shifts, sales, reports } = useAttendantShift();

  const closedShifts = shifts.filter((s) => s.status === "closed");
  const recentSales = sales.filter((s) => last30Days(s.recordedAt));
  const litersLast30 = recentSales.reduce((sum, s) => sum + s.liters, 0);
  const revenueLast30 = recentSales.reduce((sum, s) => sum + s.amount, 0);

  const dailySummary = Object.values(
    recentSales.reduce<Record<string, { date: string; liters: number; revenue: number }>>((acc, sale) => {
      const date = sale.recordedAt.slice(0, 10);
      acc[date] ??= { date, liters: 0, revenue: 0 };
      acc[date].liters += sale.liters;
      acc[date].revenue += sale.amount;
      return acc;
    }, {}),
  ).sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="space-y-6">
      <PageHeader title="Shift History" description="Your past shifts, daily sales and closing reports." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Shifts completed" value={String(closedShifts.length)} />
        <StatCard label="Liters — last 30 days" value={formatLiters(litersLast30)} />
        <StatCard label="Revenue — last 30 days" value={formatCurrency(revenueLast30)} />
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

      <SectionCard title="Daily sales summary">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Liters</th>
                <th className="px-5 py-3 font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {dailySummary.map((day) => (
                <tr key={day.date} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{day.date}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatLiters(day.liters)}</td>
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{formatCurrency(day.revenue)}</td>
                </tr>
              ))}
              {dailySummary.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No sales in the last 30 days.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Shift-closing reports">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Submitted</th>
                <th className="px-5 py-3 font-medium">Petrol (L)</th>
                <th className="px-5 py-3 font-medium">Diesel (L)</th>
                <th className="px-5 py-3 font-medium">Revenue</th>
                <th className="px-5 py-3 font-medium">Cash counted</th>
                <th className="px-5 py-3 font-medium">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {new Date(report.submittedAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatLiters(report.petrolLiters)}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatLiters(report.dieselLiters)}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatCurrency(report.revenueTotal)}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatCurrency(report.cashCounted)}</td>
                  <td className="px-5 py-3">
                    <Badge tone={varianceTone(report.variance)}>
                      {report.variance === 0 ? "Exact" : formatCurrency(report.variance)}
                    </Badge>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No closing reports submitted yet.
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
