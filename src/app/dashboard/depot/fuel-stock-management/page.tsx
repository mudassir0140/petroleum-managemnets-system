"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { EditIcon, PlusIcon, TankIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import {
  FUEL_TANKS,
  tankPercent,
  tankStatus,
  type FuelTank,
  type StockStatus,
} from "@/lib/dashboard/data/fuel-stock";
import { DEPOT, FUEL_TYPES, FUEL_TYPE_LABELS } from "@/lib/dashboard/data/stations";
import type { FuelType } from "@/lib/dashboard/data/stations";

const STATUSES: StockStatus[] = ["Healthy", "Low", "Critical"];

type TankFormState = { fuelType: FuelType; capacity: string; current: string; reorderThreshold: string };

function emptyForm(): TankFormState {
  return { fuelType: "petrol", capacity: "", current: "", reorderThreshold: "" };
}

function formFromTank(tank: FuelTank): TankFormState {
  return {
    fuelType: tank.fuelType,
    capacity: String(tank.capacity),
    current: String(tank.current),
    reorderThreshold: String(tank.reorderThreshold),
  };
}

export default function DepotFuelStockManagementPage() {
  const [tanks, setTanks] = useState<FuelTank[]>(FUEL_TANKS.filter((t) => t.site === DEPOT));
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TankFormState>(emptyForm());

  const filtered = useMemo(() => {
    return tanks.filter((t) => {
      const matchesSearch =
        t.id.toLowerCase().includes(search.toLowerCase()) ||
        FUEL_TYPE_LABELS[t.fuelType].toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === "All" || tankStatus(t) === status;
      return matchesSearch && matchesStatus;
    });
  }, [tanks, search, status]);

  const totalCapacity = tanks.reduce((sum, t) => sum + t.capacity, 0);
  const totalCurrent = tanks.reduce((sum, t) => sum + t.current, 0);
  const needsReorder = tanks.filter((t) => tankStatus(t) !== "Healthy").length;

  function openAdd() {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(tank: FuelTank) {
    setForm(formFromTank(tank));
    setEditingId(tank.id);
    setShowForm(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const capacity = Number(form.capacity) || 0;
    const current = Math.min(capacity, Number(form.current) || 0);
    const reorderThreshold = Number(form.reorderThreshold) || 0;

    if (editingId) {
      setTanks((prev) =>
        prev.map((t) =>
          t.id === editingId ? { ...t, fuelType: form.fuelType, capacity, current, reorderThreshold } : t,
        ),
      );
    } else {
      const newTank: FuelTank = {
        id: `TNK-D${tanks.length + 1}`,
        site: DEPOT,
        fuelType: form.fuelType,
        capacity,
        current,
        reorderThreshold,
      };
      setTanks((prev) => [...prev, newTank]);
    }

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fuel Stock Management"
        description="Manage depot tank records — capacity, reorder thresholds and current levels."
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            <PlusIcon className="size-3.5" />
            Add Tank
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Depot fill level"
          value={totalCapacity === 0 ? "0%" : `${Math.round((totalCurrent / totalCapacity) * 100)}%`}
          icon={TankIcon}
          hint={`${totalCurrent.toLocaleString()} / ${totalCapacity.toLocaleString()} L`}
        />
        <StatCard label="Tanks managed" value={String(tanks.length)} />
        <StatCard label="Total capacity" value={`${totalCapacity.toLocaleString()} L`} />
        <StatCard label="Needs reorder" value={String(needsReorder)} trend={needsReorder > 0 ? "down" : "up"} delta={needsReorder > 0 ? "Below threshold" : "All healthy"} />
      </div>

      <SectionCard
        title="Depot tank records"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("fuel-stock-management", filtered.map((t) => ({
                Tank: t.id,
                "Fuel Type": FUEL_TYPE_LABELS[t.fuelType],
                "Capacity (L)": t.capacity,
                "Current (L)": t.current,
                "Reorder Threshold (L)": t.reorderThreshold,
                "Fill %": tankPercent(t),
                Status: tankStatus(t),
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search tank ID or fuel type…" />
          <FilterSelect value={status} onChange={setStatus} options={STATUSES} label="Status" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Tank</th>
                <th className="px-5 py-3 font-medium">Fuel type</th>
                <th className="px-5 py-3 font-medium">Level</th>
                <th className="px-5 py-3 font-medium">Reorder threshold</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((tank) => {
                const percent = tankPercent(tank);
                const stat = tankStatus(tank);
                return (
                  <tr key={tank.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{tank.id}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{FUEL_TYPE_LABELS[tank.fuelType]}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className={`h-full rounded-full ${
                              stat === "Healthy" ? "bg-emerald-500" : stat === "Low" ? "bg-amber-500" : "bg-rose-500"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {percent}% · {tank.current.toLocaleString()}L
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{tank.reorderThreshold.toLocaleString()} L</td>
                    <td className="px-5 py-3">
                      <Badge>{stat}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(tank)}
                        aria-label={`Edit ${tank.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <EditIcon className="size-3.5" />
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
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
          Showing {filtered.length} of {tanks.length} tanks
        </p>
      </SectionCard>

      {showForm && (
        <Modal title={editingId ? "Edit Tank Record" : "Add Tank Record"} onClose={() => setShowForm(false)}>
          <form className="space-y-4" onSubmit={handleSubmit}>
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
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Capacity (L)</label>
                <input
                  required
                  type="number"
                  min={0}
                  value={form.capacity}
                  onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Current level (L)</label>
                <input
                  required
                  type="number"
                  min={0}
                  value={form.current}
                  onChange={(e) => setForm((f) => ({ ...f, current: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Reorder threshold (L)</label>
              <input
                required
                type="number"
                min={0}
                value={form.reorderThreshold}
                onChange={(e) => setForm((f) => ({ ...f, reorderThreshold: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              {editingId ? "Save Changes" : "Add Tank"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
