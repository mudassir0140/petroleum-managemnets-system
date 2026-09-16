// @ts-nocheck
"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { DownloadIcon, PlusIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import {
  FUEL_TANKS,
  STOCK_MOVEMENTS,
  type FuelTank,
  type StockMovement,
} from "@/lib/dashboard/data/fuel-stock";
import { DEPOT, FUEL_TYPES, FUEL_TYPE_LABELS } from "@/lib/dashboard/data/stations";
import type { FuelType } from "@/lib/dashboard/data/stations";

const SUPPLIERS = ["PARCO Refinery", "Attock Refinery", "PSO Terminal", "Byco Refinery"];

type ReceivingFormState = { supplier: string; fuelType: FuelType; liters: string; date: string };

function emptyForm(): ReceivingFormState {
  return {
    supplier: SUPPLIERS[0],
    fuelType: "petrol",
    liters: "",
    date: new Date().toISOString().slice(0, 10),
  };
}

export default function PetrolDieselReceivingPage() {
  const [receipts, setReceipts] = useState<StockMovement[]>(
    STOCK_MOVEMENTS.filter((m) => m.type === "Received"),
  );
  const [tanks, setTanks] = useState<FuelTank[]>(FUEL_TANKS.filter((t) => t.site === DEPOT));
  const [search, setSearch] = useState("");
  const [fuelType, setFuelType] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<ReceivingFormState>(emptyForm());

  const filtered = useMemo(() => {
    return receipts.filter((r) => {
      const matchesSearch = r.from.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase());
      const matchesFuel = fuelType === "All" || FUEL_TYPE_LABELS[r.fuelType] === fuelType;
      return matchesSearch && matchesFuel;
    });
  }, [receipts, search, fuelType]);

  const totalReceived = receipts.reduce((sum, r) => sum + r.liters, 0);
  const petrolReceived = receipts.filter((r) => r.fuelType === "petrol").reduce((sum, r) => sum + r.liters, 0);
  const dieselReceived = receipts.filter((r) => r.fuelType === "diesel").reduce((sum, r) => sum + r.liters, 0);
  const lastReceipt = receipts[0];

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const liters = Number(form.liters) || 0;
    if (liters <= 0) return;

    const newReceipt: StockMovement = {
      id: `MOV-${3010 + receipts.length + 1}`,
      date: `${form.date} ${new Date().toTimeString().slice(0, 5)}`,
      type: "Received",
      fuelType: form.fuelType,
      liters,
      from: form.supplier,
      to: DEPOT,
    };
    setReceipts((prev) => [newReceipt, ...prev]);
    setTanks((prev) =>
      prev.map((t) =>
        t.fuelType === form.fuelType ? { ...t, current: Math.min(t.capacity, t.current + liters) } : t,
      ),
    );
    setShowAdd(false);
    setForm(emptyForm());
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Petrol/Diesel Receiving"
        description="Incoming fuel deliveries from refineries into the depot."
        actions={
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            <PlusIcon className="size-3.5" />
            Log Receiving
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total received" value={`${totalReceived.toLocaleString()} L`} icon={DownloadIcon} hint={`${receipts.length} deliveries`} />
        <StatCard label="Petrol received" value={`${petrolReceived.toLocaleString()} L`} />
        <StatCard label="Diesel received" value={`${dieselReceived.toLocaleString()} L`} />
        <StatCard label="Last delivery" value={lastReceipt ? lastReceipt.from : "—"} hint={lastReceipt?.date} />
      </div>

      <SectionCard title="Current depot levels" description="Updated automatically as receiving is logged">
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
          {tanks.map((tank) => (
            <div key={tank.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{FUEL_TYPE_LABELS[tank.fuelType]}</p>
              <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{tank.current.toLocaleString()} L</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">of {tank.capacity.toLocaleString()} L</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Receiving log"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("petrol-diesel-receiving", filtered.map((r) => ({
                ID: r.id,
                Date: r.date,
                Supplier: r.from,
                "Fuel Type": FUEL_TYPE_LABELS[r.fuelType],
                Liters: r.liters,
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search supplier or entry ID…" />
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
                <th className="px-5 py-3 font-medium">Supplier</th>
                <th className="px-5 py-3 font-medium">Fuel</th>
                <th className="px-5 py-3 font-medium">Liters</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{r.date}</td>
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{r.from}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{FUEL_TYPE_LABELS[r.fuelType]}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{r.liters.toLocaleString()} L</td>
                  <td className="px-5 py-3">
                    <Badge tone="success">Received</Badge>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No receiving entries match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {filtered.length} of {receipts.length} entries
        </p>
      </SectionCard>

      {showAdd && (
        <Modal title="Log Receiving" onClose={() => setShowAdd(false)}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Supplier</label>
              <select
                value={form.supplier}
                onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {SUPPLIERS.map((s) => (
                  <option key={s} value={s}>{s}</option>
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
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Liters received</label>
                <input
                  required
                  type="number"
                  min={1}
                  value={form.liters}
                  onChange={(e) => setForm((f) => ({ ...f, liters: e.target.value }))}
                  placeholder="e.g. 200000"
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
              Log Receiving
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
