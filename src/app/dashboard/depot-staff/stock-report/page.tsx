// @ts-nocheck
"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { EditIcon, GaugeIcon, PlusIcon, TankIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import { formatLiters } from "@/lib/dashboard/format";
import { FUEL_TANKS, tankPercent, tankStatus } from "@/lib/dashboard/data/fuel-stock";
import { DEPOT, FUEL_TYPE_LABELS, type FuelType } from "@/lib/dashboard/data/stations";
import { DEPOT_STAFF, STOCK_READINGS, type StockReading } from "@/lib/dashboard/data/depot-staff";

const DEPOT_TANKS = FUEL_TANKS.filter((t) => t.site === DEPOT);
const BAR_COLOR = { Healthy: "bg-emerald-500", Low: "bg-amber-500", Critical: "bg-rose-500" } as const;
const READING_TOLERANCE = 3000;

type ReadingFormState = {
  tankId: string;
  reportedLevel: string;
  date: string;
  time: string;
  notes: string;
  reportedBy: string;
};

function tankFuel(tankId: string): FuelType {
  return DEPOT_TANKS.find((t) => t.id === tankId)?.fuelType ?? DEPOT_TANKS[0].fuelType;
}

function systemLevelFor(tankId: string): number {
  return DEPOT_TANKS.find((t) => t.id === tankId)?.current ?? 0;
}

function emptyForm(): ReadingFormState {
  const tank = DEPOT_TANKS[0];
  return {
    tankId: tank?.id ?? "",
    reportedLevel: tank?.current ? String(tank.current) : "0",
    date: new Date().toISOString().slice(0, 10),
    time: "06:00",
    notes: "",
    reportedBy: DEPOT_STAFF[0] ?? "",
  };
}

function formFromReading(r: StockReading): ReadingFormState {
  return {
    tankId: r.tankId,
    reportedLevel: String(r.reportedLevel),
    date: r.date,
    time: r.time,
    notes: r.notes,
    reportedBy: r.reportedBy,
  };
}

export default function ReportDepotStockLevelsPage() {
  const [readings, setReadings] = useState<StockReading[]>(STOCK_READINGS);
  const [search, setSearch] = useState("");
  const [tankFilter, setTankFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ReadingFormState>(emptyForm());

  const filtered = useMemo(() => {
    return readings.filter((r) => {
      const matchesSearch =
        r.tankId.toLowerCase().includes(search.toLowerCase()) ||
        r.reportedBy.toLowerCase().includes(search.toLowerCase());
      const matchesTank = tankFilter === "All" || r.tankId === tankFilter;
      return matchesSearch && matchesTank;
    });
  }, [readings, search, tankFilter]);

  const depotTotal = DEPOT_TANKS.reduce((sum, t) => sum + t.current, 0);
  const depotCapacity = DEPOT_TANKS.reduce((sum, t) => sum + t.capacity, 0);
  const latestByTank = useMemo(() => {
    const map = new Map<string, StockReading>();
    for (const r of readings) {
      const existing = map.get(r.tankId);
      if (!existing || `${r.date} ${r.time}` > `${existing.date} ${existing.time}`) map.set(r.tankId, r);
    }
    return map;
  }, [readings]);
  const flaggedCount = DEPOT_TANKS.filter((t) => {
    const latest = latestByTank.get(t.id);
    return latest && Math.abs(latest.reportedLevel - t.current) > READING_TOLERANCE;
  }).length;

  function openAdd() {
    setForm(emptyForm());
    setEditingId(null);
    setShowAdd(true);
  }

  function openEdit(reading: StockReading) {
    setForm(formFromReading(reading));
    setEditingId(reading.id);
    setShowAdd(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const reportedLevel = Number(form.reportedLevel) || 0;
    if (reportedLevel < 0) return;
    const fuelType = tankFuel(form.tankId);

    if (editingId) {
      setReadings((prev) =>
        prev.map((r) =>
          r.id === editingId
            ? { ...r, tankId: form.tankId, fuelType, reportedLevel, date: form.date, time: form.time, notes: form.notes.trim(), reportedBy: form.reportedBy }
            : r,
        ),
      );
    } else {
      const nextNumber = readings.length + 701;
      const newReading: StockReading = {
        id: `SR-${nextNumber}`,
        tankId: form.tankId,
        fuelType,
        reportedLevel,
        date: form.date,
        time: form.time,
        notes: form.notes.trim(),
        reportedBy: form.reportedBy,
      };
      setReadings((prev) => [newReading, ...prev]);
    }

    setShowAdd(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Report Depot Stock Levels"
        description="Submit manual dip readings for depot tanks and compare against system levels."
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            <PlusIcon className="size-3.5" />
            Report Reading
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Depot fill level"
          value={depotCapacity === 0 ? "0%" : `${Math.round((depotTotal / depotCapacity) * 100)}%`}
          icon={GaugeIcon}
          hint={`${formatLiters(depotTotal)} / ${formatLiters(depotCapacity)}`}
        />
        <StatCard label="Depot tanks" value={String(DEPOT_TANKS.length)} icon={TankIcon} />
        <StatCard label="Readings submitted" value={String(readings.length)} />
        <StatCard label="Flagged discrepancies" value={String(flaggedCount)} trend={flaggedCount > 0 ? "down" : "up"} delta={flaggedCount > 0 ? `> ${formatLiters(READING_TOLERANCE)} off` : "All within tolerance"} />
      </div>

      <SectionCard title="Depot tank levels (system)" description="Current system-recorded stock per depot tank">
        <div className="space-y-4 p-5">
          {DEPOT_TANKS.map((tank) => {
            const status = tankStatus(tank);
            const percent = tankPercent(tank);
            const latest = latestByTank.get(tank.id);
            return (
              <div key={tank.id}>
                <div className="mb-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {tank.id} · {FUEL_TYPE_LABELS[tank.fuelType]}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {formatLiters(tank.current)} of {formatLiters(tank.capacity)}
                    {latest ? ` · last reported ${formatLiters(latest.reportedLevel)}` : " · no reading yet"}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className={`h-full rounded-full ${BAR_COLOR[status]}`} style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        title="Stock reading log"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("depot-stock-readings", filtered.map((r) => ({
                ID: r.id, Tank: r.tankId, "Fuel Type": FUEL_TYPE_LABELS[r.fuelType], "Reported (L)": r.reportedLevel,
                "System (L)": systemLevelFor(r.tankId), "Variance (L)": r.reportedLevel - systemLevelFor(r.tankId),
                Date: r.date, Time: r.time, "Reported By": r.reportedBy, Notes: r.notes,
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search tank or staff…" />
          <FilterSelect value={tankFilter} onChange={setTankFilter} options={DEPOT_TANKS.map((t) => t.id)} label="Tank" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Reading</th>
                <th className="px-5 py-3 font-medium">Tank</th>
                <th className="px-5 py-3 font-medium">Reported vs. system</th>
                <th className="px-5 py-3 font-medium">When</th>
                <th className="px-5 py-3 font-medium">Reported by</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((r) => {
                const variance = r.reportedLevel - systemLevelFor(r.tankId);
                const flagged = Math.abs(variance) > READING_TOLERANCE;
                return (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{r.id}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{r.tankId} · {FUEL_TYPE_LABELS[r.fuelType]}</td>
                    <td className="px-5 py-3">
                      <p className="text-slate-700 dark:text-slate-300">{formatLiters(r.reportedLevel)}</p>
                      <p className={`text-xs ${flagged ? "font-medium text-rose-600 dark:text-rose-400" : "text-slate-400 dark:text-slate-500"}`}>
                        {variance === 0 ? "Matches system" : `${variance > 0 ? "+" : ""}${variance.toLocaleString()} L vs. system`}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{r.date} · {r.time}</td>
                    <td className="px-5 py-3">
                      <p className="text-slate-600 dark:text-slate-300">{r.reportedBy}</p>
                      {flagged && <Badge tone="warning">Discrepancy</Badge>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(r)}
                        aria-label={`Edit ${r.id}`}
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
                    No readings match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {filtered.length} of {readings.length} readings
        </p>
      </SectionCard>

      {showAdd && (
        <Modal title={editingId ? "Edit Reading" : "Report Reading"} onClose={() => setShowAdd(false)}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Tank</label>
                <select
                  value={form.tankId}
                  onChange={(e) => {
                    const tank = DEPOT_TANKS.find((t) => t.id === e.target.value);
                    setForm((f) => ({ ...f, tankId: e.target.value, reportedLevel: tank ? String(tank.current) : f.reportedLevel }));
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {DEPOT_TANKS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.id} — {FUEL_TYPE_LABELS[t.fuelType]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Reported level (L)</label>
                <input
                  required
                  type="number"
                  min={0}
                  value={form.reportedLevel}
                  onChange={(e) => setForm((f) => ({ ...f, reportedLevel: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
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
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Time</label>
                <input
                  required
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Reported by</label>
              <select
                value={form.reportedBy}
                onChange={(e) => setForm((f) => ({ ...f, reportedBy: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {DEPOT_STAFF.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Notes</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes about this reading"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              {editingId ? "Save Changes" : "Report Reading"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
