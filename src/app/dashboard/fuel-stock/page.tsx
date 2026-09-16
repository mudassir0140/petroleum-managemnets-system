// @ts-nocheck
"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { TankIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import { FUEL_TANKS, STOCK_MOVEMENTS, tankPercent, tankStatus } from "@/lib/dashboard/data/fuel-stock";
import { DEPOT, FUEL_TYPES, FUEL_TYPE_LABELS, type FuelType } from "@/lib/dashboard/data/stations";

const SITES = Array.from(new Set(FUEL_TANKS.map((t) => t.site)));
const STATUSES = ["Healthy", "Low", "Critical"];
const MOVEMENT_TYPES = ["Received", "Distributed"];

const BAR_COLOR = {
  Healthy: "bg-emerald-500",
  Low: "bg-amber-500",
  Critical: "bg-rose-500",
} as const;

export default function FuelStockPage() {
  const [search, setSearch] = useState("");
  const [site, setSite] = useState("All");
  const [fuelType, setFuelType] = useState("All");
  const [status, setStatus] = useState("All");
  const [movementType, setMovementType] = useState("All");

  const withStatus = useMemo(
    () => FUEL_TANKS.map((tank) => {
      const percent = tankPercent(tank);
      return { ...tank, status: tankStatus(percent), percent };
    }),
    [],
  );

  const filtered = withStatus.filter((tank) => {
    const matchesSearch =
      tank.id.toLowerCase().includes(search.toLowerCase()) ||
      tank.site.toLowerCase().includes(search.toLowerCase());
    const matchesSite = site === "All" || tank.site === site;
    const matchesFuel = fuelType === "All" || tank.fuelType === fuelType;
    const matchesStatus = status === "All" || tank.status === status;
    return matchesSearch && matchesSite && matchesFuel && matchesStatus;
  });

  const filteredMovements = STOCK_MOVEMENTS.filter(
    (m) => movementType === "All" || m.type === movementType,
  );

  const depotTanks = FUEL_TANKS.filter((t) => t.site === DEPOT);
  const totalCapacity = FUEL_TANKS.reduce((sum, t) => sum + t.capacity, 0);
  const totalCurrent = FUEL_TANKS.reduce((sum, t) => sum + t.current, 0);
  const lowCount = withStatus.filter((t) => t.status === "Low").length;
  const criticalCount = withStatus.filter((t) => t.status === "Critical").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fuel Stock"
        description="Depot and pump tank levels, with stock received/distributed history."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Network fill level"
          value={`${Math.round((totalCurrent / totalCapacity) * 100)}%`}
          icon={TankIcon}
          hint={`${totalCurrent.toLocaleString()} / ${totalCapacity.toLocaleString()} L`}
        />
        <StatCard label="Tanks tracked" value={String(FUEL_TANKS.length)} hint="1 depot & 6 pumps" />
        <StatCard label="Low stock" value={String(lowCount)} trend="down" delta="Below reorder line" />
        <StatCard label="Critical" value={String(criticalCount)} trend="down" delta="Action needed" />
      </div>

      <SectionCard title="Depot stock" description={DEPOT}>
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
          {depotTanks.map((tank) => {
            const percent = tankPercent(tank);
            const stat = tankStatus(percent);
            return (
              <div key={tank.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {FUEL_TYPE_LABELS[tank.fuelType]}
                  </p>
                  <Badge>{stat}</Badge>
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {tank.current.toLocaleString()} L
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">of {tank.capacity.toLocaleString()} L capacity</p>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className={`h-full rounded-full ${BAR_COLOR[stat]}`} style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        title="All tanks"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("fuel-stock", filtered.map((t) => ({
                ID: t.id,
                Site: t.site,
                "Fuel Type": FUEL_TYPE_LABELS[t.fuelType],
                "Capacity (L)": t.capacity,
                "Current (L)": t.current,
                "Fill %": t.percent,
                Status: t.status,
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search tank ID or site…" />
          <FilterSelect value={site} onChange={setSite} options={SITES} label="Site" />
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
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered
                .filter((t) => fuelType === "All" || FUEL_TYPE_LABELS[t.fuelType] === fuelType)
                .map((tank) => (
                <tr key={tank.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{tank.id}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{tank.site}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{FUEL_TYPE_LABELS[tank.fuelType]}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className={`h-full rounded-full ${BAR_COLOR[tank.status]}`}
                          style={{ width: `${tank.percent}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {tank.percent}% · {tank.current.toLocaleString()}L
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Badge>{tank.status}</Badge>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
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

      <SectionCard
        title="Stock history"
        description="Received from suppliers, distributed to pumps"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("stock-history", filteredMovements.map((m) => ({
                ID: m.id,
                Date: m.date,
                Type: m.type || "Transfer",
                "Fuel Type": FUEL_TYPE_LABELS[m.fuelType as FuelType] || m.fuelType,
                "Liters": m.liters || m.quantity || 0,
                From: m.from,
                To: m.to,
              })))
            }
          />
        }
      >
        <FilterBar>
          <FilterSelect value={movementType} onChange={setMovementType} options={MOVEMENT_TYPES} label="Movement" />
        </FilterBar>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Fuel</th>
                <th className="px-5 py-3 font-medium">Liters</th>
                <th className="px-5 py-3 font-medium">From</th>
                <th className="px-5 py-3 font-medium">To</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredMovements.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{m.date}</td>
                  <td className="px-5 py-3">
                    <Badge tone={m.type === "Received" ? "success" : "info"}>{m.type}</Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{FUEL_TYPE_LABELS[m.fuelType]}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{(m.liters || m.quantity || 0).toLocaleString()} L</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{m.from}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{m.to}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
