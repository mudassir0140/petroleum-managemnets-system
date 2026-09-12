"use client";

import { useMemo, useState } from "react";
import { Table, type Column } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { DonutChart } from "@/components/charts/DonutChart";
import { downloadCsv, rowsToCsv } from "@/lib/reports";
import { formatCurrency, formatDate } from "@/lib/format";
import { IconDownload, IconPrinter } from "@/components/icons";
import type { CashHandover, DailyCashSummary } from "@/lib/cashier/types";
import type { Pump } from "@/lib/types";

type ReportType = "daily" | "weekly" | "reconciliation";

const REPORT_TABS: { value: ReportType; label: string }[] = [
  { value: "daily", label: "Daily Cash Report" },
  { value: "weekly", label: "Weekly Summary" },
  { value: "reconciliation", label: "Reconciliation History" },
];

interface WeeklyRow {
  period: string;
  cashTotal: number;
  cardTotal: number;
  revenueTotal: number;
  transactionCount: number;
}

function buildWeeklyRows(daily: DailyCashSummary[]): WeeklyRow[] {
  const sorted = [...daily].sort((a, b) => (a.date < b.date ? -1 : 1));
  const weeks: DailyCashSummary[][] = [];
  for (let i = sorted.length; i > 0; i -= 7) {
    weeks.push(sorted.slice(Math.max(0, i - 7), i));
  }
  return weeks
    .filter((w) => w.length > 0)
    .map((w) => {
      const label = `${formatDate(w[0].date)} – ${formatDate(w[w.length - 1].date)}`;
      return w.reduce<WeeklyRow>(
        (acc, d) => ({
          period: label,
          cashTotal: acc.cashTotal + d.cashTotal,
          cardTotal: acc.cardTotal + d.cardTotal,
          revenueTotal: acc.revenueTotal + d.revenueTotal,
          transactionCount: acc.transactionCount + d.transactionCount,
        }),
        { period: label, cashTotal: 0, cardTotal: 0, revenueTotal: 0, transactionCount: 0 },
      );
    })
    .reverse();
}

export function CashReportExplorer({ dailyCash, handovers, pump, cashierName }: { dailyCash: DailyCashSummary[]; handovers: CashHandover[]; pump: Pump; cashierName: string }) {
  const [tab, setTab] = useState<ReportType>("daily");
  const weeklyRows = useMemo(() => buildWeeklyRows(dailyCash), [dailyCash]);

  const totals = useMemo(
    () =>
      dailyCash.reduce(
        (acc, d) => ({ cash: acc.cash + d.cashTotal, card: acc.card + d.cardTotal }),
        { cash: 0, card: 0 },
      ),
    [dailyCash],
  );

  function handlePrint() {
    window.print();
  }

  function handleDownload() {
    const filenameBase = `${pump.id}-cashier-${tab}-report`;
    if (tab === "daily") {
      const csv = rowsToCsv(
        ["Date", "Transactions", "Cash", "Card", "Revenue"],
        dailyCash.map((d) => [formatDate(d.date), d.transactionCount, d.cashTotal, d.cardTotal, d.revenueTotal]),
      );
      downloadCsv(`${filenameBase}.csv`, csv);
    } else if (tab === "weekly") {
      const csv = rowsToCsv(
        ["Period", "Transactions", "Cash", "Card", "Revenue"],
        weeklyRows.map((w) => [w.period, w.transactionCount, w.cashTotal, w.cardTotal, w.revenueTotal]),
      );
      downloadCsv(`${filenameBase}.csv`, csv);
    } else {
      const csv = rowsToCsv(
        ["Handed to", "Expected cash", "Counted", "Variance", "Notes"],
        handovers.map((h) => [h.handoverTo, h.cashExpected, h.cashCounted, h.variance, h.notes]),
      );
      downloadCsv(`${filenameBase}.csv`, csv);
    }
  }

  const dailyColumns: Column<DailyCashSummary>[] = [
    { header: "Date", cell: (row) => formatDate(row.date) },
    { header: "Transactions", align: "right", cell: (row) => row.transactionCount },
    { header: "Cash", align: "right", cell: (row) => formatCurrency(row.cashTotal) },
    { header: "Card", align: "right", cell: (row) => formatCurrency(row.cardTotal) },
    { header: "Revenue", align: "right", cell: (row) => <span className="font-semibold">{formatCurrency(row.revenueTotal)}</span> },
  ];

  const weeklyColumns: Column<WeeklyRow>[] = [
    { header: "Period", cell: (row) => row.period },
    { header: "Transactions", align: "right", cell: (row) => row.transactionCount },
    { header: "Cash", align: "right", cell: (row) => formatCurrency(row.cashTotal) },
    { header: "Card", align: "right", cell: (row) => formatCurrency(row.cardTotal) },
    { header: "Revenue", align: "right", cell: (row) => <span className="font-semibold">{formatCurrency(row.revenueTotal)}</span> },
  ];

  const handoverColumns: Column<CashHandover>[] = [
    { header: "Handed to", cell: (row) => row.handoverTo },
    { header: "Expected", align: "right", cell: (row) => formatCurrency(row.cashExpected) },
    { header: "Counted", align: "right", cell: (row) => formatCurrency(row.cashCounted) },
    {
      header: "Variance",
      align: "right",
      cell: (row) => (
        <span style={{ color: row.variance === 0 ? undefined : row.variance > 0 ? "var(--status-good-text)" : "var(--status-critical)" }}>
          {row.variance > 0 ? "+" : ""}
          {formatCurrency(row.variance)}
        </span>
      ),
    },
    { header: "Notes", cell: (row) => <span className="text-ink-muted">{row.notes || "—"}</span> },
  ];

  return (
    <div>
      <div className="no-print mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 rounded-lg border border-border-subtle bg-surface-1 p-1">
          {REPORT_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === t.value ? "bg-brand-500 text-white" : "text-ink-secondary hover:bg-surface-3"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={<IconDownload size={14} />} onClick={handleDownload}>
            Download CSV
          </Button>
          <Button variant="secondary" size="sm" icon={<IconPrinter size={14} />} onClick={handlePrint}>
            Print
          </Button>
        </div>
      </div>

      <div className="print-area rounded-2xl border border-border-subtle bg-surface-1 p-5">
        <div className="mb-4 hidden items-center justify-between print:flex">
          <div>
            <p className="text-base font-semibold">{pump.name}</p>
            <p className="text-xs text-ink-muted">{pump.id} · Cashier: {cashierName}</p>
          </div>
          <p className="text-xs text-ink-muted">Generated {formatDate(new Date().toISOString())}</p>
        </div>

        <h3 className="mb-3 text-sm font-semibold text-ink-primary">{REPORT_TABS.find((t) => t.value === tab)?.label}</h3>

        {tab === "daily" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Table columns={dailyColumns} rows={dailyCash} rowKey={(row) => row.date} emptyMessage="No transactions recorded yet." />
            </div>
            <DonutChart
              slices={[
                { name: "Cash", color: "var(--series-1)", value: totals.cash },
                { name: "Card", color: "var(--series-7)", value: totals.card },
              ]}
              format="currency"
              centerLabel="Total collected"
              tableCaption="Cash vs card collected across the reporting period"
            />
          </div>
        )}

        {tab === "weekly" && <Table columns={weeklyColumns} rows={weeklyRows} rowKey={(row) => row.period} emptyMessage="No transactions recorded yet." />}

        {tab === "reconciliation" && (
          <Table columns={handoverColumns} rows={handovers} rowKey={(row) => row.id} emptyMessage="No shift has been handed over yet." />
        )}
      </div>
    </div>
  );
}
