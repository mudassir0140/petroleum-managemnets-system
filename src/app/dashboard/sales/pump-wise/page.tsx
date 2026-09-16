// @ts-nocheck
"use client";

import { useMemo, useState } from "react";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { EditIcon, GaugeIcon, PlusIcon, WalletIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import { formatCurrency, formatLiters } from "@/lib/dashboard/format";
import { PUMPS } from "@/lib/dashboard/data/pumps";
import { FUEL_TYPES, FUEL_TYPE_LABELS, type FuelType } from "@/lib/dashboard/data/stations";
import {
  PUMP_SALESPERSON,
  SALE_RECORDS,
  pumpSalesTotals,
  type SaleRecord,
} from "@/lib/dashboard/data/sales";

const PUMP_FILTERS = PUMPS.map((p) => `Pump ${p.number}`);
const FUEL_FILTERS = FUEL_TYPES.map((f) => FUEL_TYPE_LABELS[f]);

type SaleFormState = {
  pumpNumber: number;
  date: string;
  fuelType: FuelType;
  liters: string;
  revenue: string;
  salesperson: string;
};

function emptyForm(): SaleFormState {
  return {
    pumpNumber: PUMPS[0].number,
    date: new Date().toISOString().slice(0, 10),
    fuelType: "petrol",
    liters: "",
    revenue: "",
    salesperson: PUMP_SALESPERSON[PUMPS[0].number] ?? "",
  };
}

function formFromRecord(record: SaleRecord): SaleFormState {
  return {
    pumpNumber: record.pumpNumber,
    date: record.date,
    fuelType: record.fuelType,
    liters: String(record.liters),
    revenue: String(record.revenue),
    salesperson: record.salesperson,
  };
}

export default function PumpWiseSalesPage() {
  const [records, setRecords] = useState<SaleRecord[]>(SALE_RECORDS);
  const [search, setSearch] = useState("");
  const [pumpFilter, setPumpFilter] = useState("All");
  const [fuelFilter, setFuelFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SaleFormState>(emptyForm());

  const totals = useMemo(() => pumpSalesTotals(records), [records]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const matchesSearch =
        r.salesperson.toLowerCase().includes(search.toLowerCase()) ||
        r.id.toLowerCase().includes(search.toLowerCase()) ||
        r.pumpName.toLowerCase().includes(search.toLowerCase());
      const matchesPump = pumpFilter === "All" || `Pump ${r.pumpNumber}` === pumpFilter;
      const matchesFuel = fuelFilter === "All" || FUEL_TYPE_LABELS[r.fuelType] === fuelFilter;
      return matchesSearch && matchesPump && matchesFuel;
    });
  }, [records, search, pumpFilter, fuelFilter]);

  const totalLiters = totals.reduce((sum, t) => sum + t.liters, 0);
  const totalRevenue = totals.reduce((sum, t) => sum + t.revenue, 0);
  const topPump = totals.slice().sort((a, b) => b.revenue - a.revenue)[0];
  const maxRevenue = Math.max(...totals.map((t) => t.revenue), 1);

  function openAdd() {
    setForm(emptyForm());
    setEditingId(null);
    setShowAdd(true);
  }

  function openEdit(record: SaleRecord) {
    setForm(formFromRecord(record));
    setEditingId(record.id);
    setShowAdd(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const liters = Number(form.liters) || 0;
    const revenue = Number(form.revenue) || 0;
    if (liters <= 0 || revenue <= 0) return;
    const pump = PUMPS.find((p) => p.number === form.pumpNumber) ?? PUMPS[0];

    if (editingId) {
      setRecords((prev) =>
        prev.map((r) =>
          r.id === editingId
            ? {
                ...r,
                pumpNumber: pump.number,
                pumpName: pump.name,
                date: form.date,
                fuelType: form.fuelType,
                liters,
                revenue,
                salesperson: form.salesperson.trim() || r.salesperson,
              }
            : r,
        ),
      );
    } else {
      const nextNumber = records.length + 3001;
      const newRecord: SaleRecord = {
        id: `SL-${nextNumber}`,
        pumpNumber: pump.number,
        pumpName: pump.name,
        date: form.date,
        fuelType: form.fuelType,
        liters,
        revenue,
        salesperson: form.salesperson.trim() || PUMP_SALESPERSON[pump.number] || "—",
      };
      setRecords((prev) => [newRecord, ...prev]);
    }

    setShowAdd(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pump-wise Sales"
        description="Fuel sales recorded per pump, broken down by fuel type and salesperson."
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            <PlusIcon className="size-3.5" />
            Add Sale Record
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total litres sold" value={formatLiters(totalLiters)} icon={GaugeIcon} hint={`${totals.length} pumps reporting`} />
        <StatCard label="Total revenue" value={formatCurrency(totalRevenue)} icon={WalletIcon} trend="up" delta="This period" />
        <StatCard label="Top pump" value={topPump ? `Pump ${topPump.pumpNumber}` : "—"} hint={topPump?.pumpName} />
        <StatCard label="Sale records" value={String(records.length)} hint={`${FUEL_FILTERS.length} fuel types`} />
      </div>

      <SectionCard title="Sales by pump" description="Aggregated litres and revenue across all recorded sales">
        <div className="space-y-4 p-5">
          {totals.map((t) => (
            <div key={t.pumpNumber}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Pump {t.pumpNumber} · {t.pumpName}
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  {formatLiters(t.liters)} · {formatCurrency(t.revenue)}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{ width: `${(t.revenue / maxRevenue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Sale records"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("pump-wise-sale-records", filtered.map((r) => ({
                ID: r.id,
                Pump: `Pump ${r.pumpNumber}`,
                Date: r.date,
                "Fuel Type": FUEL_TYPE_LABELS[r.fuelType],
                "Litres": r.liters,
                "Revenue (Rs.)": r.revenue,
                Salesperson: r.salesperson,
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search salesperson, pump or ID…" />
          <FilterSelect value={pumpFilter} onChange={setPumpFilter} options={PUMP_FILTERS} label="Pump" />
          <FilterSelect value={fuelFilter} onChange={setFuelFilter} options={FUEL_FILTERS} label="Fuel" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Record</th>
                <th className="px-5 py-3 font-medium">Pump</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Fuel</th>
                <th className="px-5 py-3 font-medium">Litres</th>
                <th className="px-5 py-3 font-medium">Revenue</th>
                <th className="px-5 py-3 font-medium">Salesperson</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{r.id}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">Pump {r.pumpNumber}</td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{r.date}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{FUEL_TYPE_LABELS[r.fuelType]}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatLiters(r.liters)}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatCurrency(r.revenue)}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{r.salesperson}</td>
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
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No sale records match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {filtered.length} of {records.length} records
        </p>
      </SectionCard>

      {showAdd && (
        <Modal title={editingId ? "Edit Sale Record" : "Add Sale Record"} onClose={() => setShowAdd(false)}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Pump</label>
                <select
                  value={form.pumpNumber}
                  onChange={(e) => {
                    const pumpNumber = Number(e.target.value);
                    setForm((f) => ({
                      ...f,
                      pumpNumber,
                      salesperson: PUMP_SALESPERSON[pumpNumber] ?? f.salesperson,
                    }));
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {PUMPS.map((p) => (
                    <option key={p.id} value={p.number}>
                      Pump {p.number} — {p.name}
                    </option>
                  ))}
                </select>
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
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Litres</label>
                <input
                  required
                  type="number"
                  min={0}
                  value={form.liters}
                  onChange={(e) => setForm((f) => ({ ...f, liters: e.target.value }))}
                  placeholder="e.g. 4800"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Revenue (Rs.)</label>
                <input
                  required
                  type="number"
                  min={0}
                  value={form.revenue}
                  onChange={(e) => setForm((f) => ({ ...f, revenue: e.target.value }))}
                  placeholder="e.g. 1348800"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Salesperson</label>
                <input
                  required
                  value={form.salesperson}
                  onChange={(e) => setForm((f) => ({ ...f, salesperson: e.target.value }))}
                  placeholder="e.g. Saima Yousaf"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              {editingId ? "Save Changes" : "Add Record"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
