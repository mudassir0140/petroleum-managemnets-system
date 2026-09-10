"use client";

import { useMemo, useState } from "react";
import { DownloadIcon } from "@/components/icons";
import { PumpStatusBadge, TripStatusBadge } from "@/components/ops/badge";
import { FilterBar } from "@/components/ops/filter-controls";
import { PageHeader } from "@/components/ops/page-header";
import { SectionCard } from "@/components/ops/section-card";
import { driverById, TANKERS, tankerById } from "@/lib/data/fleet";
import { pumpById, pumpStockPercent, PUMPS } from "@/lib/data/pumps";
import { exportToCsv } from "@/lib/export-csv";
import { formatCurrency, formatLiters } from "@/lib/format";
import { useTankerTrips } from "@/lib/store/use-tanker-trips";

const DATE_OPTIONS = [
  { value: "all", label: "All dates" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
];

const REPORTS = [
  { key: "dispatch", label: "Daily Dispatch Report" },
  { key: "performance", label: "Pump Performance Report" },
] as const;

export default function ManagerReportsPage() {
  const { trips } = useTankerTrips();
  const [report, setReport] = useState<(typeof REPORTS)[number]["key"]>("dispatch");
  const [date, setDate] = useState("all");
  const [pumpFilter, setPumpFilter] = useState("all");
  const [tankerFilter, setTankerFilter] = useState("all");

  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      const matchesDate =
        date === "all" ||
        (date === "today" && trip.departureTime.startsWith("Today")) ||
        (date === "yesterday" && trip.departureTime.startsWith("Yesterday"));
      const matchesPump = pumpFilter === "all" || trip.destinationPumpId === pumpFilter;
      const matchesTanker = tankerFilter === "all" || trip.tankerId === tankerFilter;
      return matchesDate && matchesPump && matchesTanker;
    });
  }, [trips, date, pumpFilter, tankerFilter]);

  const filteredPumps = useMemo(() => {
    return PUMPS.filter((pump) => pumpFilter === "all" || pump.id === pumpFilter);
  }, [pumpFilter]);

  function handleExportDispatch() {
    exportToCsv(
      "daily-dispatch-report.csv",
      filteredTrips.map((trip) => ({
        Tanker: tankerById(trip.tankerId)?.regNumber ?? "",
        Driver: driverById(trip.driverId)?.name ?? "",
        Destination: pumpById(trip.destinationPumpId)?.name ?? "",
        Product: trip.product,
        "Quantity (L)": trip.quantityLiters,
        Departure: trip.departureTime,
        "Expected Arrival": trip.expectedArrival,
        "Actual Arrival": trip.actualArrival ?? "",
        Status: trip.status,
      })),
    );
  }

  function handleExportPerformance() {
    exportToCsv(
      "pump-performance-report.csv",
      filteredPumps.map((pump) => ({
        Pump: pump.name,
        Code: pump.code,
        City: pump.city,
        Status: pump.status,
        "Stock %": pumpStockPercent(pump),
        "Liters Sold Today": pump.todaySalesLiters,
        "Sales Value Today": pump.todaySalesValue,
        "Last Delivery": pump.lastDelivery,
      })),
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manager Reports"
        description="Daily dispatch and pump performance reports, filterable by date, pump and tanker."
      />

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        {REPORTS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setReport(item.key)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              report === item.key
                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <SectionCard noPadding>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <FilterBar
            filters={[
              ...(report === "dispatch"
                ? [
                    {
                      key: "date",
                      label: "Filter by date",
                      value: date,
                      options: DATE_OPTIONS,
                      onChange: setDate,
                    },
                  ]
                : []),
              {
                key: "pump",
                label: "Filter by pump",
                value: pumpFilter,
                options: [{ value: "all", label: "All pumps" }, ...PUMPS.map((p) => ({ value: p.id, label: p.name }))],
                onChange: setPumpFilter,
              },
              ...(report === "dispatch"
                ? [
                    {
                      key: "tanker",
                      label: "Filter by tanker",
                      value: tankerFilter,
                      options: [
                        { value: "all", label: "All tankers" },
                        ...TANKERS.map((t) => ({ value: t.id, label: t.regNumber })),
                      ],
                      onChange: setTankerFilter,
                    },
                  ]
                : []),
            ]}
          />
          <button
            type="button"
            onClick={report === "dispatch" ? handleExportDispatch : handleExportPerformance}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <DownloadIcon className="size-4" />
            Export CSV
          </button>
        </div>

        {report === "dispatch" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="px-5 py-3 font-medium">Tanker</th>
                  <th className="px-5 py-3 font-medium">Driver</th>
                  <th className="px-5 py-3 font-medium">Destination</th>
                  <th className="px-5 py-3 font-medium">Product / Qty</th>
                  <th className="px-5 py-3 font-medium">Departure</th>
                  <th className="px-5 py-3 font-medium">Arrival</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTrips.map((trip) => (
                  <tr key={trip.id}>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {tankerById(trip.tankerId)?.regNumber}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {driverById(trip.driverId)?.name}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {pumpById(trip.destinationPumpId)?.name}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {trip.product} · {formatLiters(trip.quantityLiters)}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {trip.departureTime}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {trip.actualArrival ?? trip.expectedArrival}
                    </td>
                    <td className="px-5 py-3">
                      <TripStatusBadge status={trip.status} />
                    </td>
                  </tr>
                ))}
                {filteredTrips.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                      No trips match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="px-5 py-3 font-medium">Pump</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Stock %</th>
                  <th className="px-5 py-3 font-medium text-right">Liters sold</th>
                  <th className="px-5 py-3 font-medium text-right">Sales value</th>
                  <th className="px-5 py-3 font-medium">Last delivery</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPumps.map((pump) => (
                  <tr key={pump.id}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">{pump.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{pump.code}</p>
                    </td>
                    <td className="px-5 py-3">
                      <PumpStatusBadge status={pump.status} />
                    </td>
                    <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-300">
                      {pumpStockPercent(pump)}%
                    </td>
                    <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-300">
                      {formatLiters(pump.todaySalesLiters)}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(pump.todaySalesValue)}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {pump.lastDelivery}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
