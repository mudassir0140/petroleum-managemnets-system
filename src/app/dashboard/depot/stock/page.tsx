// @ts-nocheck
"use client";

import { useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { EditIcon, PlusIcon, TankIcon } from "@/components/icons";
import {
  FUEL_TANKS,
  tankPercent,
  tankStatus,
  type FuelTank,
} from "@/lib/dashboard/data/fuel-stock";
import { DEPOT, FUEL_TYPES, FUEL_TYPE_LABELS } from "@/lib/dashboard/data/stations";
import type { FuelType } from "@/lib/dashboard/data/stations";

const BAR_COLOR = {
  Healthy: "bg-emerald-500",
  Low: "bg-amber-500",
  Critical: "bg-rose-500",
} as const;

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

export default function DepotStockPage() {
  const [tanks, setTanks] = useState<FuelTank[]>(FUEL_TANKS.filter((t) => t.site === DEPOT));
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TankFormState>(emptyForm());

  const totalCapacity = tanks.reduce((sum, t) => sum + t.capacity, 0);
  const totalCurrent = tanks.reduce((sum, t) => sum + t.current, 0);
  const needsReorder = tanks.filter((t) => tankStatus(tankPercent(t)) !== "Healthy").length;

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
        title="Depot Stock"
        description={`Live tank levels at ${DEPOT}.`}
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
        <StatCard label="Tanks tracked" value={String(tanks.length)} />
        <StatCard label="Total capacity" value={`${totalCapacity.toLocaleString()} L`} />
        <StatCard label="Needs reorder" value={String(needsReorder)} trend={needsReorder > 0 ? "down" : "up"} delta={needsReorder > 0 ? "Below threshold" : "All healthy"} />
      </div>

      <SectionCard title="Depot tanks" description="Click a tank to adjust its level or capacity">
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
          {tanks.map((tank) => {
            const percent = tankPercent(tank);
            const stat = tankStatus(percent);
            return (
              <div key={tank.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {FUEL_TYPE_LABELS[tank.fuelType]}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{tank.id}</p>
                  </div>
                  <Badge>{stat}</Badge>
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {tank.current.toLocaleString()} L
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">of {tank.capacity.toLocaleString()} L capacity</p>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className={`h-full rounded-full ${BAR_COLOR[stat]}`} style={{ width: `${percent}%` }} />
                </div>
                <p className="mt-2 text-xs text-slate-400">Reorder threshold: {tank.reorderThreshold.toLocaleString()} L</p>
                <button
                  type="button"
                  onClick={() => openEdit(tank)}
                  className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <EditIcon className="size-3.5" />
                  Adjust level
                </button>
              </div>
            );
          })}
          {tanks.length === 0 && (
            <p className="col-span-full py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              No depot tanks yet — add one to get started.
            </p>
          )}
        </div>
      </SectionCard>

      {showForm && (
        <Modal title={editingId ? "Adjust Depot Tank" : "Add Depot Tank"} onClose={() => setShowForm(false)}>
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
