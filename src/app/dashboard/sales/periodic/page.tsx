// @ts-nocheck
"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { GaugeIcon, WalletIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import { formatCurrency, formatCurrencyCompact, formatLiters } from "@/lib/dashboard/format";
import { DAILY_SALES, MONTHLY_SALES, WEEKLY_SALES, type PeriodPoint } from "@/lib/dashboard/data/sales";

type View = "daily" | "weekly" | "monthly";

const VIEWS: { id: View; label: string; data: PeriodPoint[]; unitLabel: string }[] = [
  { id: "daily", label: "Daily", data: DAILY_SALES, unitLabel: "Last 7 days" },
  { id: "weekly", label: "Weekly", data: WEEKLY_SALES, unitLabel: "Last 4 weeks" },
  { id: "monthly", label: "Monthly", data: MONTHLY_SALES, unitLabel: "Last 6 months" },
];

export default function PeriodicSalesPage() {
  const [view, setView] = useState<View>("daily");
  const active = VIEWS.find((v) => v.id === view) ?? VIEWS[0];

  const totalLiters = useMemo(() => active.data.reduce((sum, d) => sum + d.liters, 0), [active]);
  const totalRevenue = useMemo(() => active.data.reduce((sum, d) => sum + d.revenue, 0), [active]);
  const peak = useMemo(
    () => active.data.slice().sort((a, b) => b.revenue - a.revenue)[0],
    [active],
  );
  const average = active.data.length === 0 ? 0 : totalRevenue / active.data.length;
  const maxRevenue = Math.max(...active.data.map((d) => d.revenue), 1);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily / Weekly / Monthly Sales"
        description="Litres and revenue trends across every reporting period."
        actions={
          <ExportButton
            label="Export CSV"
            onClick={() =>
              downloadCsv(`${view}-sales`, active.data.map((d) => ({
                Period: d.label,
                "Litres": d.liters,
                "Revenue (Rs.)": d.revenue,
              })))
            }
          />
        }
      />

      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setView(v.id)}
            className={`rounded-md px-4 py-1.5 text-xs font-semibold transition ${
              view === v.id
                ? "bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total litres" value={formatLiters(totalLiters)} icon={GaugeIcon} hint={active.unitLabel} />
        <StatCard label="Total revenue" value={formatCurrencyCompact(totalRevenue)} icon={WalletIcon} />
        <StatCard label="Average per period" value={formatCurrencyCompact(average)} />
        <StatCard label="Peak period" value={peak?.label ?? "—"} hint={peak ? formatCurrency(peak.revenue) : undefined} trend="up" delta="Best performing" />
      </div>

      <SectionCard title={`${active.label} revenue`} description={active.unitLabel}>
        <div className="p-5">
          <div className="flex h-52 items-end gap-3">
            {active.data.map((d) => (
              <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex h-40 w-full flex-col-reverse">
                  <div
                    className="w-full rounded-t-md bg-amber-500"
                    style={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
                    title={`${formatCurrency(d.revenue)} · ${formatLiters(d.liters)}`}
                  />
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title={`${active.label} breakdown`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Period</th>
                <th className="px-5 py-3 font-medium">Litres</th>
                <th className="px-5 py-3 font-medium">Revenue</th>
                <th className="px-5 py-3 font-medium">Share of total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {active.data.map((d) => (
                <tr key={d.label} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{d.label}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatLiters(d.liters)}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatCurrency(d.revenue)}</td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                    {totalRevenue === 0 ? "0.0" : ((d.revenue / totalRevenue) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
