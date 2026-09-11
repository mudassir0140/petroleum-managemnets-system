"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { PlusIcon, TruckIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import {
  FUEL_TANKS,
  STOCK_MOVEMENTS,
  type FuelTank,
  type StockMovement,
} from "@/lib/dashboard/data/fuel-stock";
import { DEPOT, FUEL_TYPES, FUEL_TYPE_LABELS } from "@/lib/dashboard/data/stations";
import type { FuelType } from "@/lib/dashboard/data/stations";

const PUMPS = ["Pump 1", "Pump 2", "Pump 3", "Pump 4", "Pump 5", "Pump 6"];

type DistributionFormState = { pump: string; fuelType: FuelType; liters: string; date: string };

function emptyForm(): DistributionFormState {
  return {
    pump: PUMPS[0],
    fuelType: "petrol",
    liters: "",
    date: new Date().toISOString().slice(0, 10),
  };
}

export default function StockDistributionPage() {
  const [dispatches, setDispatches] = useState<StockMovement[]>(
    STOCK_MOVEMENTS.filter((m) => m.type === "Distributed"),
  );
  const [tanks, setTanks] = useState<FuelTank[]>(FUEL_TANKS.filter((t) => t.site === DEPOT));
  const [search, setSearch] = useState("");
  const [fuelType, setFuelType] = useState("All");
  const [pump, setPump] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<DistributionFormState>(emptyForm());

  const filtered = useMemo(() => {
    return dispatches.filter((d) => {
      const matchesSearch = d.to.toLowerCase().includes(search.toLowerCase()) || d.id.toLowerCase().includes(search.toLowerCase());
      const matchesFuel = fuelType === "All" || FUEL_TYPE_LABELS[d.fuelType] === fuelType;
      const matchesPump = pump === "All" || d.to === pump;
      return matchesSearch && matchesFuel && matchesPump;
    });
  }, [dispatches, search, fuelType, pump]);

  const totalDistributed = dispatches.reduce((sum, d) => sum + d.liters, 0);
  const byPump = PUMPS.map((p) => ({
    pump: p,
    liters: dispatches.filter((d) => d.to === p).reduce((sum, d) => sum + d.liters, 0),
  })).sort((a, b) => b.liters - a.liters);
  const topPump = byPump[0];

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const liters = Number(form.liters) || 0;
    if (liters <= 0) return;

    const newDispatch: StockMovement = {
      id: `MOV-${3010 + dispatches.length + 1}`,
      date: `${form.date} ${new Date().toTimeString().slice(0, 5)}`,
      type: "Distributed",
      fuelType: form.fuelType,
      liters,
      from: DEPOT,
      to: form.pump,
    };
    setDispatches((prev) => [newDispatch, ...prev]);
    setTanks((prev) =>
      prev.map((t) =>
        t.fuelType === form.fuelType ? { ...t, current: Math.max(0, t.current - liters) } : t,
      ),
    );
    setShowAdd(false);
    setForm(emptyForm());
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Distribution"
        description="Fuel dispatched from the depot out to each pump."
        actions={
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            <PlusIcon className="size-3.5" />
            Log Distribution
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total distributed" value={`${totalDistributed.toLocaleString()} L`} icon={TruckIcon} hint={`${dispatches.length} dispatches`} />
        <StatCard label="Most-supplied pump" value={topPump?.pump ?? "—"} hint={topPump ? `${topPump.liters.toLocaleString()} L` : undefined} />
        <StatCard label="Depot fuel remaining" value={`${tanks.reduce((sum, t) => sum + t.current, 0).toLocaleString()} L`} />
        <StatCard label="Pumps supplied" value={String(byPump.filter((p) => p.liters > 0).length)} hint="of 6 pumps" />
      </div>

      <SectionCard title="Distribution by pump" description="Total liters supplied, this log">
        <div className="space-y-3 p-5">
          {byPump.map((p) => {
            const max = byPump[0]?.liters || 1;
            const percent = Math.round((p.liters / max) * 100);
            return (
              <div key={p.pump}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{p.pump}</span>
                  <span className="text-slate-500 dark:text-slate-400">{p.liters.toLocaleString()} L</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        title="Distribution log"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("stock-distribution", filtered.map((d) => ({
                ID: d.id,
                Date: d.date,
                Pump: d.to,
                "Fuel Type": FUEL_TYPE_LABELS[d.fuelType],
                Liters: d.liters,
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search pump or entry ID…" />
          <FilterSelect value={pump} onChange={setPump} options={PUMPS} label="Pump" />
          <FilterSelect
            value={fuelType}
            onChange={setFuelType}
            options={FUEL_TYPES.map((f) => FUEL_TYPE_LABELS[f])}
            label="Fuel"
          />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Destination</th>
                <th className="px-5 py-3 font-medium">Fuel</th>
                <th className="px-5 py-3 font-medium">Liters</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{d.date}</td>
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{d.to}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{FUEL_TYPE_LABELS[d.fuelType]}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{d.liters.toLocaleString()} L</td>
                  <td className="px-5 py-3">
                    <Badge tone="info">Dispatched</Badge>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No distribution entries match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {filtered.length} of {dispatches.length} entries
        </p>
      </SectionCard>

      {showAdd && (
        <Modal title="Log Distribution" onClose={() => setShowAdd(false)}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Destination pump</label>
              <select
                value={form.pump}
                onChange={(e) => setForm((f) => ({ ...f, pump: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {PUMPS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Fuel type</label>
              <select
                value={form.fuelType}
                onChange={(e) => setForm((f) => ({ ...f, fuelType: e.target.value as FuelType }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {FUEL_TYPES.map((f) => (
                  <option key={f} value={f}>{FUEL_TYPE_LABELS[f]}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Liters dispatched</label>
                <input
                  required
                  type="number"
                  min={1}
                  value={form.liters}
                  onChange={(e) => setForm((f) => ({ ...f, liters: e.target.value }))}
                  placeholder="e.g. 30000"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Date</label>
                <input
                  required
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              Log Distribution
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
