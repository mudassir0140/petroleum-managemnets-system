// @ts-nocheck
"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { AlertTriangleIcon, GaugeIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import {
  FUEL_TANKS,
  STOCK_MOVEMENTS,
  tankPercent,
  tankStatus,
} from "@/lib/dashboard/data/fuel-stock";
import { DEPOT, FUEL_TYPES, FUEL_TYPE_LABELS } from "@/lib/dashboard/data/stations";
import type { FuelType } from "@/lib/dashboard/data/stations";

const BAR_COLOR = {
  Healthy: "bg-emerald-500",
  Low: "bg-amber-500",
  Critical: "bg-rose-500",
} as const;

const STATUSES = ["Healthy", "Low", "Critical"];

// Rough days-of-supply estimate: total distributed per fuel type over the
// date range covered by the movement log, applied as an average daily rate.
function averageDailyDistribution(): Record<FuelType, number> {
  const distributed = STOCK_MOVEMENTS.filter((m) => m.type === "Distributed");
  const dates = distributed.map((m) => new Date(m.date.slice(0, 10)).getTime());
  const spanDays = dates.length > 0 ? Math.max(1, (Math.max(...dates) - Math.min(...dates)) / 86400000) : 1;

  const result: Record<string, number> = {};
  for (const fuel of FUEL_TYPES) {
    const total = distributed.filter((m) => m.fuelType === fuel).reduce((sum, m) => sum + m.liters, 0);
    result[fuel] = total / spanDays;
  }
  return result as Record<FuelType, number>;
}

export default function RemainingStockPage() {
  const [search, setSearch] = useState("");
  const [site, setSite] = useState("All");
  const [fuelType, setFuelType] = useState("All");
  const [status, setStatus] = useState("All");
  const [reorderRequests, setReorderRequests] = useState<Record<string, string>>({});
  const [requesting, setRequesting] = useState<(typeof FUEL_TANKS)[number] | null>(null);
  const [note, setNote] = useState("");

  const dailyRate = useMemo(() => averageDailyDistribution(), []);
  const sites = Array.from(new Set(FUEL_TANKS.map((t) => t.site)));

  const withStatus = useMemo(
    () =>
      FUEL_TANKS.map((tank) => {
        const rate = dailyRate[tank.fuelType] || 0;
        const daysLeft = rate > 0 ? Math.round(tank.current / rate) : null;
        return { ...tank, status: tankStatus(tank), percent: tankPercent(tank), daysLeft };
      }).sort((a, b) => a.percent - b.percent),
    [dailyRate],
  );

  const filtered = withStatus.filter((t) => {
    const matchesSearch = t.id.toLowerCase().includes(search.toLowerCase()) || t.site.toLowerCase().includes(search.toLowerCase());
    const matchesSite = site === "All" || t.site === site;
    const matchesFuel = fuelType === "All" || FUEL_TYPE_LABELS[t.fuelType] === fuelType;
    const matchesStatus = status === "All" || t.status === status;
    return matchesSearch && matchesSite && matchesFuel && matchesStatus;
  });

  const depotTanks = withStatus.filter((t) => t.site === DEPOT);
  const depotAlerts = depotTanks.filter((t) => t.status !== "Healthy");
  const networkTotal = FUEL_TANKS.reduce((sum, t) => sum + t.current, 0);
  const networkCapacity = FUEL_TANKS.reduce((sum, t) => sum + t.capacity, 0);
  const lowCount = withStatus.filter((t) => t.status === "Low").length;
  const criticalCount = withStatus.filter((t) => t.status === "Critical").length;

  function openRequest(tank: (typeof FUEL_TANKS)[number]) {
    setRequesting(tank);
    setNote("");
  }

  function submitRequest(event: React.FormEvent) {
    event.preventDefault();
    if (!requesting) return;
    setReorderRequests((prev) => ({
      ...prev,
      [requesting.id]: note.trim() || "Reorder requested",
    }));
    setRequesting(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Remaining Stock"
        description="Network-wide remaining fuel, lowest levels first, with depot reorder alerts."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Network fill level"
          value={networkCapacity === 0 ? "0%" : `${Math.round((networkTotal / networkCapacity) * 100)}%`}
          icon={GaugeIcon}
          hint={`${networkTotal.toLocaleString()} / ${networkCapacity.toLocaleString()} L`}
        />
        <StatCard label="Depot remaining" value={`${depotTanks.reduce((s, t) => s + t.current, 0).toLocaleString()} L`} />
        <StatCard label="Low stock tanks" value={String(lowCount)} trend="down" delta="Below reorder line" />
        <StatCard label="Critical tanks" value={String(criticalCount)} icon={AlertTriangleIcon} trend="down" delta="Action needed" />
      </div>

      <SectionCard title="Depot reorder alerts" description="Depot tanks at or below their reorder threshold">
        <div className="space-y-3 p-5">
          {depotAlerts.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">All depot tanks are healthy — no reorder needed.</p>
          )}
          {depotAlerts.map((tank) => (
            <div
              key={tank.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {FUEL_TYPE_LABELS[tank.fuelType]} — {tank.id}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {tank.current.toLocaleString()} L remaining
                  {tank.daysLeft !== null ? ` · ~${tank.daysLeft} days left at current usage` : ""}
                </p>
                {reorderRequests[tank.id] && (
                  <p className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                    {reorderRequests[tank.id]}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge>{tank.status}</Badge>
                <button
                  type="button"
                  onClick={() => openRequest(tank)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {reorderRequests[tank.id] ? "Update request" : "Request Reorder"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Remaining stock — all sites"
        description="Depot and pump tanks, lowest fill % first"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("remaining-stock", filtered.map((t) => ({
                ID: t.id,
                Site: t.site,
                "Fuel Type": FUEL_TYPE_LABELS[t.fuelType],
                "Current (L)": t.current,
                "Capacity (L)": t.capacity,
                "Fill %": t.percent,
                "Est. Days Left": t.daysLeft ?? "—",
                Status: t.status,
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search tank ID or site…" />
          <FilterSelect value={site} onChange={setSite} options={sites} label="Site" />
          <FilterSelect
            value={fuelType}
            onChange={setFuelType}
            options={FUEL_TYPES.map((f) => FUEL_TYPE_LABELS[f])}
            label="Fuel"
          />
          <FilterSelect value={status} onChange={setStatus} options={STATUSES} label="Status" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Tank</th>
                <th className="px-5 py-3 font-medium">Site</th>
                <th className="px-5 py-3 font-medium">Fuel</th>
                <th className="px-5 py-3 font-medium">Level</th>
                <th className="px-5 py-3 font-medium">Est. days left</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((tank) => (
                <tr key={tank.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{tank.id}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{tank.site}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{FUEL_TYPE_LABELS[tank.fuelType]}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className={`h-full rounded-full ${BAR_COLOR[tank.status]}`} style={{ width: `${tank.percent}%` }} />
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {tank.percent}% · {tank.current.toLocaleString()}L
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {tank.daysLeft !== null ? `${tank.daysLeft}d` : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <Badge>{tank.status}</Badge>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No tanks match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {filtered.length} of {FUEL_TANKS.length} tanks
        </p>
      </SectionCard>

      {requesting && (
        <Modal
          title={`Request reorder — ${requesting.id}`}
          subtitle={`${FUEL_TYPE_LABELS[requesting.fuelType]} at ${requesting.site}`}
          onClose={() => setRequesting(null)}
        >
          <form className="space-y-4" onSubmit={submitRequest}>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Note for the receiving team</label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Requesting 200,000 L petrol before Friday"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              Submit Reorder Request
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
