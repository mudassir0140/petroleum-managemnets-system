"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { ClockIcon, EditIcon, GaugeIcon, PlusIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import { formatLiters } from "@/lib/dashboard/format";
import { TANKERS } from "@/lib/dashboard/data/tankers";
import { FUEL_TYPES, FUEL_TYPE_LABELS, type FuelType } from "@/lib/dashboard/data/stations";
import {
  DEPOT_STAFF,
  LOADING_BAYS,
  LOADING_LOG,
  loadingDurationMinutes,
  loadingVariance,
  type LoadingBay,
  type LoadingLogEntry,
} from "@/lib/dashboard/data/depot-staff";

const VARIANCE_TOLERANCE = 100;

type LogFormState = {
  tankerId: string;
  fuelType: FuelType;
  bay: LoadingBay;
  orderedLiters: string;
  loadedLiters: string;
  startTime: string;
  endTime: string;
  date: string;
  loadedBy: string;
};

function driverFor(tankerId: string) {
  return TANKERS.find((t) => t.id === tankerId)?.driver ?? "Unassigned";
}

function emptyForm(): LogFormState {
  const tanker = TANKERS[0];
  return {
    tankerId: tanker.id,
    fuelType: tanker.fuelType,
    bay: LOADING_BAYS[0],
    orderedLiters: String(tanker.capacity),
    loadedLiters: String(tanker.capacity),
    startTime: "09:00",
    endTime: "09:45",
    date: new Date().toISOString().slice(0, 10),
    loadedBy: DEPOT_STAFF[0],
  };
}

function formFromEntry(entry: LoadingLogEntry): LogFormState {
  return {
    tankerId: entry.tankerId,
    fuelType: entry.fuelType,
    bay: entry.bay,
    orderedLiters: String(entry.orderedLiters),
    loadedLiters: String(entry.loadedLiters),
    startTime: entry.startTime,
    endTime: entry.endTime,
    date: entry.date,
    loadedBy: entry.loadedBy,
  };
}

export default function RecordLoadingQuantityPage() {
  const [entries, setEntries] = useState<LoadingLogEntry[]>(LOADING_LOG);
  const [search, setSearch] = useState("");
  const [bayFilter, setBayFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LogFormState>(emptyForm());

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const matchesSearch =
        e.tankerId.toLowerCase().includes(search.toLowerCase()) ||
        e.driver.toLowerCase().includes(search.toLowerCase()) ||
        e.loadedBy.toLowerCase().includes(search.toLowerCase());
      const matchesBay = bayFilter === "All" || e.bay === bayFilter;
      return matchesSearch && matchesBay;
    });
  }, [entries, search, bayFilter]);

  const totalLoadedToday = entries
    .filter((e) => e.date === "2026-09-10")
    .reduce((sum, e) => sum + e.loadedLiters, 0);
  const avgDuration =
    entries.length === 0 ? 0 : entries.reduce((sum, e) => sum + loadingDurationMinutes(e), 0) / entries.length;
  const discrepancyCount = entries.filter((e) => Math.abs(loadingVariance(e)) > VARIANCE_TOLERANCE).length;

  function openAdd() {
    setForm(emptyForm());
    setEditingId(null);
    setShowAdd(true);
  }

  function openEdit(entry: LoadingLogEntry) {
    setForm(formFromEntry(entry));
    setEditingId(entry.id);
    setShowAdd(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const orderedLiters = Number(form.orderedLiters) || 0;
    const loadedLiters = Number(form.loadedLiters) || 0;
    if (orderedLiters <= 0 || loadedLiters <= 0) return;
    const driver = driverFor(form.tankerId);

    if (editingId) {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === editingId
            ? {
                ...e,
                tankerId: form.tankerId,
                driver,
                fuelType: form.fuelType,
                bay: form.bay,
                orderedLiters,
                loadedLiters,
                startTime: form.startTime,
                endTime: form.endTime,
                date: form.date,
                loadedBy: form.loadedBy,
              }
            : e,
        ),
      );
    } else {
      const nextNumber = entries.length + 601;
      const newEntry: LoadingLogEntry = {
        id: `LOG-${nextNumber}`,
        tankerId: form.tankerId,
        driver,
        fuelType: form.fuelType,
        bay: form.bay,
        orderedLiters,
        loadedLiters,
        startTime: form.startTime,
        endTime: form.endTime,
        date: form.date,
        loadedBy: form.loadedBy,
      };
      setEntries((prev) => [newEntry, ...prev]);
    }

    setShowAdd(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Record Loading Quantity & Time"
        description="Log the actual litres loaded and the start/end time for each tanker."
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            <PlusIcon className="size-3.5" />
            Record Entry
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Litres loaded (yesterday)" value={formatLiters(totalLoadedToday)} icon={GaugeIcon} />
        <StatCard label="Average duration" value={`${Math.round(avgDuration)} min`} icon={ClockIcon} />
        <StatCard label="Entries logged" value={String(entries.length)} />
        <StatCard label="Quantity discrepancies" value={String(discrepancyCount)} trend={discrepancyCount > 0 ? "down" : "up"} delta={discrepancyCount > 0 ? `> ${VARIANCE_TOLERANCE} L off` : "All within tolerance"} />
      </div>

      <SectionCard
        title="Loading log"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("loading-quantity-time-log", filtered.map((e) => ({
                ID: e.id, Tanker: e.tankerId, Driver: e.driver, "Fuel Type": FUEL_TYPE_LABELS[e.fuelType], Bay: e.bay,
                "Ordered (L)": e.orderedLiters, "Loaded (L)": e.loadedLiters, "Variance (L)": loadingVariance(e),
                "Start Time": e.startTime, "End Time": e.endTime, "Duration (min)": loadingDurationMinutes(e),
                Date: e.date, "Loaded By": e.loadedBy,
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search tanker, driver or staff…" />
          <FilterSelect value={bayFilter} onChange={setBayFilter} options={[...LOADING_BAYS]} label="Bay" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Entry</th>
                <th className="px-5 py-3 font-medium">Tanker / Driver</th>
                <th className="px-5 py-3 font-medium">Quantity</th>
                <th className="px-5 py-3 font-medium">Time</th>
                <th className="px-5 py-3 font-medium">Duration</th>
                <th className="px-5 py-3 font-medium">Loaded by</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((e) => {
                const variance = loadingVariance(e);
                const flagged = Math.abs(variance) > VARIANCE_TOLERANCE;
                return (
                  <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">{e.id}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{e.date} · {e.bay}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-slate-700 dark:text-slate-300">{e.tankerId}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{e.driver} · {FUEL_TYPE_LABELS[e.fuelType]}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-slate-700 dark:text-slate-300">{formatLiters(e.loadedLiters)}</p>
                      <p className={`text-xs ${flagged ? "font-medium text-rose-600 dark:text-rose-400" : "text-slate-400 dark:text-slate-500"}`}>
                        {variance === 0 ? "On target" : `${variance > 0 ? "+" : ""}${variance} L vs. ordered`}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{e.startTime} – {e.endTime}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{loadingDurationMinutes(e)} min</td>
                    <td className="px-5 py-3">
                      <p className="text-slate-600 dark:text-slate-300">{e.loadedBy}</p>
                      {flagged && <Badge tone="warning">Discrepancy</Badge>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(e)}
                        aria-label={`Edit ${e.id}`}
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
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No log entries match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {filtered.length} of {entries.length} entries
        </p>
      </SectionCard>

      {showAdd && (
        <Modal title={editingId ? "Edit Log Entry" : "Record Loading Entry"} onClose={() => setShowAdd(false)}>
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
                      orderedLiters: tanker ? String(tanker.capacity) : f.orderedLiters,
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
            <div className="grid grid-cols-3 gap-3">
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
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Ordered (L)</label>
                <input
                  required
                  type="number"
                  min={0}
                  value={form.orderedLiters}
                  onChange={(e) => setForm((f) => ({ ...f, orderedLiters: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Loaded (L)</label>
                <input
                  required
                  type="number"
                  min={0}
                  value={form.loadedLiters}
                  onChange={(e) => setForm((f) => ({ ...f, loadedLiters: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Start time</label>
                <input
                  required
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">End time</label>
                <input
                  required
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
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
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Loaded by</label>
              <select
                value={form.loadedBy}
                onChange={(e) => setForm((f) => ({ ...f, loadedBy: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {DEPOT_STAFF.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              {editingId ? "Save Changes" : "Record Entry"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
