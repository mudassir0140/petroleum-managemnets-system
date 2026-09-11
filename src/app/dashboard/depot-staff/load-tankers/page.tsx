"use client";

import { useMemo, useState } from "react";
import { Badge, type BadgeTone } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { EditIcon, GaugeIcon, PlusIcon, TruckIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import { formatLiters } from "@/lib/dashboard/format";
import { TANKERS } from "@/lib/dashboard/data/tankers";
import { FUEL_TYPES, FUEL_TYPE_LABELS, type FuelType } from "@/lib/dashboard/data/stations";
import {
  LOADING_BAYS,
  TANKER_LOADINGS,
  type LoadingBay,
  type TankerLoading,
  type TankerLoadingStatus,
} from "@/lib/dashboard/data/depot-staff";

const STATUSES: TankerLoadingStatus[] = ["Scheduled", "Loading", "Completed"];
const AT_DEPOT_TANKERS = TANKERS.filter((t) => t.status === "At Depot" || t.status === "Returning");

const STATUS_TONE: Record<TankerLoadingStatus, BadgeTone> = {
  Scheduled: "neutral",
  Loading: "info",
  Completed: "success",
};

type LoadFormState = {
  tankerId: string;
  fuelType: FuelType;
  bay: LoadingBay;
  targetLiters: string;
  scheduledDate: string;
  scheduledTime: string;
  status: TankerLoadingStatus;
};

function driverFor(tankerId: string) {
  return TANKERS.find((t) => t.id === tankerId)?.driver ?? "Unassigned";
}

function emptyForm(): LoadFormState {
  const tanker = TANKERS[0];
  return {
    tankerId: tanker.id,
    fuelType: tanker.fuelType,
    bay: LOADING_BAYS[0],
    targetLiters: String(tanker.capacity),
    scheduledDate: new Date().toISOString().slice(0, 10),
    scheduledTime: "09:00",
    status: "Scheduled",
  };
}

function formFromLoading(l: TankerLoading): LoadFormState {
  return {
    tankerId: l.tankerId,
    fuelType: l.fuelType,
    bay: l.bay,
    targetLiters: String(l.targetLiters),
    scheduledDate: l.scheduledDate,
    scheduledTime: l.scheduledTime,
    status: l.status,
  };
}

export default function LoadFuelIntoTankersPage() {
  const [loadings, setLoadings] = useState<TankerLoading[]>(TANKER_LOADINGS);
  const [search, setSearch] = useState("");
  const [bayFilter, setBayFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LoadFormState>(emptyForm());

  const filtered = useMemo(() => {
    return loadings.filter((l) => {
      const matchesSearch =
        l.tankerId.toLowerCase().includes(search.toLowerCase()) ||
        l.driver.toLowerCase().includes(search.toLowerCase()) ||
        l.id.toLowerCase().includes(search.toLowerCase());
      const matchesBay = bayFilter === "All" || l.bay === bayFilter;
      const matchesStatus = statusFilter === "All" || l.status === statusFilter;
      return matchesSearch && matchesBay && matchesStatus;
    });
  }, [loadings, search, bayFilter, statusFilter]);

  const occupiedBays = new Set(loadings.filter((l) => l.status === "Loading").map((l) => l.bay)).size;
  const scheduledToday = loadings.filter((l) => l.status === "Scheduled" && l.scheduledDate === "2026-09-11").length;
  const completedToday = loadings.filter((l) => l.status === "Completed" && l.scheduledDate === "2026-09-11").length;

  function openAdd() {
    setForm(emptyForm());
    setEditingId(null);
    setShowAdd(true);
  }

  function openEdit(loading: TankerLoading) {
    setForm(formFromLoading(loading));
    setEditingId(loading.id);
    setShowAdd(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const targetLiters = Number(form.targetLiters) || 0;
    if (targetLiters <= 0) return;
    const driver = driverFor(form.tankerId);

    if (editingId) {
      setLoadings((prev) =>
        prev.map((l) =>
          l.id === editingId
            ? { ...l, tankerId: form.tankerId, driver, fuelType: form.fuelType, bay: form.bay, targetLiters, scheduledDate: form.scheduledDate, scheduledTime: form.scheduledTime, status: form.status }
            : l,
        ),
      );
    } else {
      const nextNumber = loadings.length + 401;
      const newLoading: TankerLoading = {
        id: `LD-${nextNumber}`,
        tankerId: form.tankerId,
        driver,
        fuelType: form.fuelType,
        bay: form.bay,
        targetLiters,
        scheduledDate: form.scheduledDate,
        scheduledTime: form.scheduledTime,
        status: form.status,
      };
      setLoadings((prev) => [newLoading, ...prev]);
    }

    setShowAdd(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Load Fuel into Tankers"
        description="Schedule and track tanker loading at the depot bays."
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            <PlusIcon className="size-3.5" />
            Schedule Loading
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Bays occupied" value={`${occupiedBays} / ${LOADING_BAYS.length}`} icon={GaugeIcon} />
        <StatCard label="Scheduled today" value={String(scheduledToday)} icon={TruckIcon} />
        <StatCard label="Completed today" value={String(completedToday)} trend="up" delta="Loaded & dispatched" />
        <StatCard label="Tankers at depot" value={String(AT_DEPOT_TANKERS.length)} hint="Available for loading" />
      </div>

      <SectionCard
        title="Loading schedule"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("tanker-loading-schedule", filtered.map((l) => ({
                ID: l.id, Tanker: l.tankerId, Driver: l.driver, "Fuel Type": FUEL_TYPE_LABELS[l.fuelType],
                Bay: l.bay, "Target (L)": l.targetLiters, Date: l.scheduledDate, Time: l.scheduledTime, Status: l.status,
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search tanker, driver or ID…" />
          <FilterSelect value={bayFilter} onChange={setBayFilter} options={[...LOADING_BAYS]} label="Bay" />
          <FilterSelect value={statusFilter} onChange={setStatusFilter} options={STATUSES} label="Status" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Loading</th>
                <th className="px-5 py-3 font-medium">Tanker / Driver</th>
                <th className="px-5 py-3 font-medium">Fuel</th>
                <th className="px-5 py-3 font-medium">Bay</th>
                <th className="px-5 py-3 font-medium">Target</th>
                <th className="px-5 py-3 font-medium">Scheduled</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{l.id}</td>
                  <td className="px-5 py-3">
                    <p className="text-slate-700 dark:text-slate-300">{l.tankerId}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{l.driver}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{FUEL_TYPE_LABELS[l.fuelType]}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{l.bay}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatLiters(l.targetLiters)}</td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{l.scheduledDate} · {l.scheduledTime}</td>
                  <td className="px-5 py-3">
                    <Badge tone={STATUS_TONE[l.status]}>{l.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(l)}
                      aria-label={`Edit ${l.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <EditIcon className="size-3.5" />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No loadings match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {filtered.length} of {loadings.length} loadings
        </p>
      </SectionCard>

      {showAdd && (
        <Modal title={editingId ? "Edit Loading" : "Schedule Loading"} onClose={() => setShowAdd(false)}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Tanker</label>
                <select
                  value={form.tankerId}
                  onChange={(e) => {
                    const tanker = TANKERS.find((t) => t.id === e.target.value);
                    setForm((f) => ({
                      ...f,
                      tankerId: e.target.value,
                      fuelType: tanker?.fuelType ?? f.fuelType,
                      targetLiters: tanker ? String(tanker.capacity) : f.targetLiters,
                    }));
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {TANKERS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.id} — {t.driver}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Bay</label>
                <select
                  value={form.bay}
                  onChange={(e) => setForm((f) => ({ ...f, bay: e.target.value as LoadingBay }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {LOADING_BAYS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
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
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Target litres</label>
                <input
                  required
                  type="number"
                  min={0}
                  value={form.targetLiters}
                  onChange={(e) => setForm((f) => ({ ...f, targetLiters: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Date</label>
                <input
                  required
                  type="date"
                  value={form.scheduledDate}
                  onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Time</label>
                <input
                  required
                  type="time"
                  value={form.scheduledTime}
                  onChange={(e) => setForm((f) => ({ ...f, scheduledTime: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TankerLoadingStatus }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              {editingId ? "Save Changes" : "Schedule Loading"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
