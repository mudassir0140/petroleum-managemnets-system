"use client";

import { useMemo, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { LineAreaChart } from "@/components/charts/LineAreaChart";
import { BarChart } from "@/components/charts/BarChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { Table, type Column } from "@/components/ui/Table";
import { formatCurrency, formatCurrencyCompact, formatDate, formatDateShort, formatLitres, formatLitresCompact, titleCase } from "@/lib/format";
import type { DailySales, Shift } from "@/lib/types";

const RANGES = [
  { label: "7D", days: 7 },
  { label: "14D", days: 14 },
  { label: "30D", days: 30 },
];

const SHIFTS: Shift[] = ["morning", "evening", "night"];

export function SalesExplorer({ history }: { history: DailySales[] }) {
  const [rangeDays, setRangeDays] = useState(14);

  const slice = useMemo(() => history.slice(-rangeDays), [history, rangeDays]);

  const totals = useMemo(
    () =>
      slice.reduce(
        (acc, d) => ({
          revenue: acc.revenue + d.revenue,
          petrolLitres: acc.petrolLitres + d.petrolLitres,
          dieselLitres: acc.dieselLitres + d.dieselLitres,
          cash: acc.cash + d.cashRevenue,
          card: acc.card + d.cardRevenue,
        }),
        { revenue: 0, petrolLitres: 0, dieselLitres: 0, cash: 0, card: 0 },
      ),
    [slice],
  );

  const shiftTotals = useMemo(
    () =>
      SHIFTS.map((shift) => {
        const rows = slice.flatMap((d) => d.shifts.filter((s) => s.shift === shift));
        return {
          shift,
          petrolLitres: rows.reduce((sum, r) => sum + r.petrolLitres, 0),
          dieselLitres: rows.reduce((sum, r) => sum + r.dieselLitres, 0),
          revenue: rows.reduce((sum, r) => sum + r.revenue, 0),
          cashRevenue: rows.reduce((sum, r) => sum + r.cashRevenue, 0),
          cardRevenue: rows.reduce((sum, r) => sum + r.cardRevenue, 0),
        };
      }),
    [slice],
  );

  const columns: Column<DailySales>[] = [
    { header: "Date", cell: (row) => formatDate(row.date) },
    { header: "Petrol", align: "right", cell: (row) => formatLitres(row.petrolLitres) },
    { header: "Diesel", align: "right", cell: (row) => formatLitres(row.dieselLitres) },
    { header: "Cash", align: "right", cell: (row) => formatCurrency(row.cashRevenue) },
    { header: "Card", align: "right", cell: (row) => formatCurrency(row.cardRevenue) },
    { header: "Revenue", align: "right", cell: (row) => <span className="font-semibold">{formatCurrency(row.revenue)}</span> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-border-subtle bg-surface-1 p-1">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setRangeDays(r.days)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                rangeDays === r.days ? "bg-brand-500 text-white" : "text-ink-secondary hover:bg-surface-3"
              }`}
            >
              Last {r.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-ink-muted">
          <span>
            Litres: <span className="font-semibold text-ink-primary">{formatLitresCompact(totals.petrolLitres + totals.dieselLitres)}</span>
          </span>
          <span>
            Revenue: <span className="font-semibold text-ink-primary">{formatCurrencyCompact(totals.revenue)}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Revenue trend" subtitle={`Last ${rangeDays} days`} />
          <LineAreaChart
            labels={slice.map((d) => formatDateShort(d.date))}
            series={[{ name: "Revenue", color: "var(--brand-500)", data: slice.map((d) => d.revenue), area: true }]}
            format="currencyCompact"
            tableCaption={`Daily revenue for the last ${rangeDays} days`}
          />
        </Card>
        <Card>
          <CardHeader title="Payment breakdown" subtitle={`Last ${rangeDays} days`} />
          <DonutChart
            slices={[
              { name: "Cash", color: "var(--series-1)", value: totals.cash },
              { name: "Card", color: "var(--series-7)", value: totals.card },
            ]}
            format="currencyCompact"
            centerLabel="Total revenue"
            tableCaption={`Cash vs card revenue for the last ${rangeDays} days`}
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Petrol vs diesel litres" subtitle={`Last ${rangeDays} days`} />
          <LineAreaChart
            labels={slice.map((d) => formatDateShort(d.date))}
            series={[
              { name: "Petrol", color: "var(--fuel-petrol)", data: slice.map((d) => d.petrolLitres) },
              { name: "Diesel", color: "var(--fuel-diesel)", data: slice.map((d) => d.dieselLitres) },
            ]}
            format="litresCompact"
            tableCaption={`Petrol and diesel litres sold, last ${rangeDays} days`}
          />
        </Card>
        <Card>
          <CardHeader title="Shift-wise sales" subtitle={`Aggregated over last ${rangeDays} days`} />
          <BarChart
            labels={shiftTotals.map((s) => titleCase(s.shift))}
            series={[
              { name: "Petrol", color: "var(--fuel-petrol)", data: shiftTotals.map((s) => s.petrolLitres) },
              { name: "Diesel", color: "var(--fuel-diesel)", data: shiftTotals.map((s) => s.dieselLitres) },
            ]}
            format="litresCompact"
            tableCaption={`Litres sold per shift, last ${rangeDays} days`}
          />
        </Card>
      </div>

      <Card>
        <CardHeader title="Sales history" subtitle={`Daily breakdown — last ${rangeDays} days`} />
        <Table columns={columns} rows={[...slice].reverse()} rowKey={(row) => row.date} />
      </Card>
    </div>
  );
}
