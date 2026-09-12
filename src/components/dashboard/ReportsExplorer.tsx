"use client";

import { useMemo, useState } from "react";
import { Table, type Column } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { DonutChart } from "@/components/charts/DonutChart";
import { Badge } from "@/components/ui/Badge";
import { IconDownload, IconPrinter } from "@/components/icons";
import { buildDailyRows, buildMonthlyRows, buildWeeklyRows, downloadCsv, rowsToCsv, type ReportRow } from "@/lib/reports";
import { formatCurrency, formatDate, formatPumpAddress, titleCase } from "@/lib/format";
import type { DailySales, PaymentSummary, Pump } from "@/lib/types";

type ReportType = "daily" | "weekly" | "monthly" | "fuel" | "payment";

const REPORT_TABS: { value: ReportType; label: string }[] = [
  { value: "daily", label: "Daily Sales" },
  { value: "weekly", label: "Weekly Sales" },
  { value: "monthly", label: "Monthly Sales" },
  { value: "fuel", label: "Fuel-wise Sales" },
  { value: "payment", label: "Payment Summary" },
];

const SALES_COLUMNS: Column<ReportRow>[] = [
  { header: "Period", cell: (row) => row.period },
  { header: "Petrol (L)", align: "right", cell: (row) => row.petrolLitres.toLocaleString() },
  { header: "Diesel (L)", align: "right", cell: (row) => row.dieselLitres.toLocaleString() },
  { header: "Cash", align: "right", cell: (row) => formatCurrency(row.cashRevenue) },
  { header: "Card", align: "right", cell: (row) => formatCurrency(row.cardRevenue) },
  { header: "Revenue", align: "right", cell: (row) => <span className="font-semibold">{formatCurrency(row.revenue)}</span> },
];

export function ReportsExplorer({ history, payments, pump }: { history: DailySales[]; payments: PaymentSummary; pump: Pump }) {
  const [tab, setTab] = useState<ReportType>("daily");

  const dailyRows = useMemo(() => buildDailyRows(history), [history]);
  const weeklyRows = useMemo(() => buildWeeklyRows(history), [history]);
  const monthlyRows = useMemo(() => buildMonthlyRows(history), [history]);

  const fuelTotals = useMemo(() => {
    const petrolLitres = history.reduce((s, d) => s + d.petrolLitres, 0);
    const dieselLitres = history.reduce((s, d) => s + d.dieselLitres, 0);
    const petrolRevenue = Math.round((petrolLitres / (petrolLitres + dieselLitres)) * history.reduce((s, d) => s + d.revenue, 0));
    const dieselRevenue = history.reduce((s, d) => s + d.revenue, 0) - petrolRevenue;
    return { petrolLitres, dieselLitres, petrolRevenue, dieselRevenue };
  }, [history]);

  function handlePrint() {
    window.print();
  }

  function handleDownload() {
    const title = REPORT_TABS.find((t) => t.value === tab)?.label ?? "Report";
    const filenameBase = `${pump.id}-${title.toLowerCase().replace(/\s+/g, "-")}`;
    if (tab === "daily" || tab === "weekly" || tab === "monthly") {
      const rows = tab === "daily" ? dailyRows : tab === "weekly" ? weeklyRows : monthlyRows;
      const csv = rowsToCsv(
        ["Period", "Petrol (L)", "Diesel (L)", "Cash", "Card", "Revenue"],
        rows.map((r) => [r.period, r.petrolLitres, r.dieselLitres, r.cashRevenue, r.cardRevenue, r.revenue]),
      );
      downloadCsv(`${filenameBase}.csv`, csv);
    } else if (tab === "fuel") {
      const csv = rowsToCsv(
        ["Fuel", "Litres", "Revenue"],
        [
          ["Petrol", fuelTotals.petrolLitres, fuelTotals.petrolRevenue],
          ["Diesel", fuelTotals.dieselLitres, fuelTotals.dieselRevenue],
        ],
      );
      downloadCsv(`${filenameBase}.csv`, csv);
    } else {
      const csv = rowsToCsv(
        ["Date", "Amount", "Method", "Note", "Status"],
        payments.history.map((p) => [formatDate(p.date), p.amount, titleCase(p.method), p.note, titleCase(p.status)]),
      );
      downloadCsv(`${filenameBase}.csv`, csv);
    }
  }

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
            <p className="text-xs text-ink-muted">
              {formatPumpAddress(pump)} · {pump.id} · Owner: {pump.ownerName}
            </p>
          </div>
          <p className="text-xs text-ink-muted">Generated {formatDate(new Date().toISOString())}</p>
        </div>

        <h3 className="mb-3 text-sm font-semibold text-ink-primary">{REPORT_TABS.find((t) => t.value === tab)?.label} Report</h3>

        {(tab === "daily" || tab === "weekly" || tab === "monthly") && (
          <Table columns={SALES_COLUMNS} rows={tab === "daily" ? dailyRows : tab === "weekly" ? weeklyRows : monthlyRows} rowKey={(row) => row.period} />
        )}

        {tab === "fuel" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DonutChart
              slices={[
                { name: "Petrol", color: "var(--fuel-petrol)", value: fuelTotals.petrolLitres },
                { name: "Diesel", color: "var(--fuel-diesel)", value: fuelTotals.dieselLitres },
              ]}
              format="litres"
              centerLabel="Total litres"
              tableCaption="Fuel-wise litres sold over the reporting period"
            />
            <Table
              columns={[
                { header: "Fuel", cell: (row: { name: string; litres: number; revenue: number }) => row.name },
                { header: "Litres", align: "right", cell: (row) => row.litres.toLocaleString() },
                { header: "Revenue", align: "right", cell: (row) => formatCurrency(row.revenue) },
              ]}
              rows={[
                { name: "Petrol", litres: fuelTotals.petrolLitres, revenue: fuelTotals.petrolRevenue },
                { name: "Diesel", litres: fuelTotals.dieselLitres, revenue: fuelTotals.dieselRevenue },
              ]}
              rowKey={(row) => row.name}
            />
          </div>
        )}

        {tab === "payment" && (
          <div>
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <p className="text-xs text-ink-muted">Total due this cycle</p>
                <p className="text-sm font-semibold">{formatCurrency(payments.totalDueThisCycle)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">Advance paid</p>
                <p className="text-sm font-semibold">{formatCurrency(payments.advancePaid)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">Remaining due</p>
                <p className="text-sm font-semibold">{formatCurrency(payments.remainingDue)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">Next due date</p>
                <p className="text-sm font-semibold">{formatDate(payments.nextDueDate)}</p>
              </div>
            </div>
            <Table
              columns={[
                { header: "Date", cell: (row) => formatDate(row.date) },
                { header: "Amount", align: "right", cell: (row) => formatCurrency(row.amount) },
                { header: "Method", cell: (row) => titleCase(row.method) },
                { header: "Status", cell: (row) => <Badge tone={row.status === "completed" ? "good" : "warning"}>{titleCase(row.status)}</Badge> },
              ]}
              rows={payments.history}
              rowKey={(row) => row.id}
            />
          </div>
        )}
      </div>
    </div>
  );
}
