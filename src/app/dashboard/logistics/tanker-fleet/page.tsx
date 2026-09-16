// @ts-nocheck
"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { EditIcon, PlusIcon, TruckIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import {
  TANKERS,
  type Tanker,
  type TankerStatus,
} from "@/lib/dashboard/data/tankers";
import { DEPOT, DEPOT_POINT, FUEL_TYPES, FUEL_TYPE_LABELS } from "@/lib/dashboard/data/stations";
import type { FuelType } from "@/lib/dashboard/data/stations";

const STATUSES: TankerStatus[] = ["At Depot", "In Transit", "At Pump", "Returning"];

type TankerFormState = {
  driver: string;
  driverPhone: string;
  driverLicense: string;
  capacity: string;
  fuelType: FuelType;
  status: TankerStatus;
};

function emptyForm(): TankerFormState {
  return { driver: "", driverPhone: "", driverLicense: "", capacity: "", fuelType: "petrol", status: "At Depot" };
}

function formFromTanker(tanker: Tanker): TankerFormState {
  return {
    driver: tanker.driver,
    driverPhone: tanker.driverPhone,
    driverLicense: tanker.driverLicense,
    capacity: String(tanker.capacity),
    fuelType: tanker.fuelType,
    status: tanker.status,
  };
}

export default function LogisticsTankerFleetPage() {
  const [tankers, setTankers] = useState<Tanker[]>(TANKERS);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TankerFormState>(emptyForm());

  const filtered = useMemo(() => {
    return tankers.filter((t) => {
      const matchesSearch =
        t.id.toLowerCase().includes(search.toLowerCase()) ||
        t.driver.toLowerCase().includes(search.toLowerCase()) ||
        t.driverLicense.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === "All" || t.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [tankers, search, status]);

  const totalCapacity = tankers.reduce((sum, t) => sum + t.capacity, 0);
  const active = tankers.filter((t) => t.status !== "At Depot").length;
  const atDepot = tankers.filter((t) => t.status === "At Depot").length;

  function openAdd() {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(tanker: Tanker) {
    setForm(formFromTanker(tanker));
    setEditingId(tanker.id);
    setShowForm(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.driver.trim()) return;
    const capacity = Number(form.capacity) || 0;

    if (editingId) {
      setTankers((prev) =>
        prev.map((t) =>
          t.id === editingId
            ? {
                ...t,
                driver: form.driver.trim(),
                driverPhone: form.driverPhone.trim() || t.driverPhone,
                driverLicense: form.driverLicense.trim() || t.driverLicense,
                capacity,
                fuelType: form.fuelType,
                status: form.status,
              }
            : t,
        ),
      );
    } else {
      const nextNumber = tankers.length + 101;
      const newTanker: Tanker = {
        id: `T-${nextNumber}`,
        driver: form.driver.trim(),
        driverPhone: form.driverPhone.trim() || "—",
        driverLicense: form.driverLicense.trim() || "—",
        capacity,
        fuelType: form.fuelType,
        status: form.status,
        direction: "idle",
        from: DEPOT,
        to: "—",
        departureTime: "—",
        expectedArrival: "—",
        progress: 0,
        location: `${DEPOT} yard`,
        route: [DEPOT_POINT],
      };
      setTankers((prev) => [...prev, newTanker]);
    }

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tanker Fleet"
        description="Fleet roster — capacity, assigned driver and current status of every tanker."
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            <PlusIcon className="size-3.5" />
            Add Tanker
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Fleet size" value={String(tankers.length)} icon={TruckIcon} hint={`${(totalCapacity / 1000).toFixed(0)}K L combined capacity`} />
        <StatCard label="On the road" value={String(active)} trend="up" delta="Live" />
        <StatCard label="At depot" value={String(atDepot)} />
        <StatCard label="Total capacity" value={`${totalCapacity.toLocaleString()} L`} />
      </div>

      <SectionCard
        title="All tankers"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("tanker-fleet-roster", filtered.map((t) => ({
                Tanker: t.id,
                Driver: t.driver,
                "Driver Phone": t.driverPhone,
                "Driver Licence": t.driverLicense,
                "Fuel Type": FUEL_TYPE_LABELS[t.fuelType],
                "Capacity (L)": t.capacity,
                Status: t.status,
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search tanker, driver or licence…" />
          <FilterSelect value={status} onChange={setStatus} options={STATUSES} label="Status" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Tanker</th>
                <th className="px-5 py-3 font-medium">Driver</th>
                <th className="px-5 py-3 font-medium">Fuel type</th>
                <th className="px-5 py-3 font-medium">Capacity</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{t.id}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    <p>{t.driver}</p>
                    <p className="text-xs text-slate-400">{t.driverLicense}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{FUEL_TYPE_LABELS[t.fuelType]}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{t.capacity.toLocaleString()} L</td>
                  <td className="px-5 py-3">
                    <Badge>{t.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(t)}
                      aria-label={`Edit ${t.id}`}
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
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No tankers match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {filtered.length} of {tankers.length} tankers
        </p>
      </SectionCard>

      {showForm && (
        <Modal title={editingId ? "Edit Tanker" : "Add Tanker"} onClose={() => setShowForm(false)}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Driver name</label>
              <input
                required
                value={form.driver}
                onChange={(e) => setForm((f) => ({ ...f, driver: e.target.value }))}
                placeholder="e.g. Nasir Hussain"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Driver phone</label>
                <input
                  value={form.driverPhone}
                  onChange={(e) => setForm((f) => ({ ...f, driverPhone: e.target.value }))}
                  placeholder="+92 3xx xxx xxxx"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Driver licence no.</label>
                <input
                  value={form.driverLicense}
                  onChange={(e) => setForm((f) => ({ ...f, driverLicense: e.target.value }))}
                  placeholder="e.g. KHI-204581"
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
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TankerStatus }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              {editingId ? "Save Changes" : "Add Tanker"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
