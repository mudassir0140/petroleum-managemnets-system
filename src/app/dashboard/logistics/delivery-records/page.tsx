"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { ClipboardIcon, EditIcon, PlusIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import { DELIVERIES, type Delivery, type DeliveryStatus } from "@/lib/dashboard/data/deliveries";
import { TANKERS } from "@/lib/dashboard/data/tankers";
import { DEPOT, FUEL_TYPES, FUEL_TYPE_LABELS } from "@/lib/dashboard/data/stations";
import type { FuelType } from "@/lib/dashboard/data/stations";

const STATUSES: DeliveryStatus[] = ["Delivered", "In Transit", "Delayed", "Cancelled"];

type DeliveryFormState = {
  tanker: string;
  driver: string;
  fuelType: FuelType;
  pump: string;
  route: string;
  orderedLiters: string;
  unloadedLiters: string;
  departedDepot: string;
  arrivedPump: string;
  date: string;
  status: DeliveryStatus;
};

function emptyForm(): DeliveryFormState {
  const tanker = TANKERS[0];
  return {
    tanker: tanker?.id ?? "",
    driver: tanker?.driver ?? "",
    fuelType: "petrol",
    pump: "",
    route: "",
    orderedLiters: "",
    unloadedLiters: "",
    departedDepot: "",
    arrivedPump: "",
    date: new Date().toISOString().slice(0, 10),
    status: "In Transit",
  };
}

function formFromDelivery(delivery: Delivery): DeliveryFormState {
  return {
    tanker: delivery.tanker,
    driver: delivery.driver,
    fuelType: delivery.fuelType,
    pump: delivery.pump,
    route: delivery.route,
    orderedLiters: String(delivery.orderedLiters),
    unloadedLiters: String(delivery.unloadedLiters),
    departedDepot: delivery.departedDepot,
    arrivedPump: delivery.arrivedPump ?? "",
    date: delivery.date,
    status: delivery.status,
  };
}

export default function LogisticsDeliveryRecordsPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>(DELIVERIES);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DeliveryFormState>(emptyForm());

  const filtered = useMemo(() => {
    return deliveries.filter((d) => {
      const matchesSearch =
        d.id.toLowerCase().includes(search.toLowerCase()) ||
        d.tanker.toLowerCase().includes(search.toLowerCase()) ||
        d.pump.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === "All" || d.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [deliveries, search, status]);

  const delivered = deliveries.filter((d) => d.status === "Delivered");
  const delayedOrCancelled = deliveries.filter((d) => d.status === "Delayed" || d.status === "Cancelled").length;
  const avgDiscrepancy =
    delivered.reduce((sum, d) => sum + (d.unloadedLiters - d.orderedLiters), 0) / (delivered.length || 1);

  function openAdd() {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(delivery: Delivery) {
    setForm(formFromDelivery(delivery));
    setEditingId(delivery.id);
    setShowForm(true);
  }

  function handleTankerChange(tankerId: string) {
    const tanker = TANKERS.find((t) => t.id === tankerId);
    setForm((f) => ({ ...f, tanker: tankerId, driver: tanker?.driver ?? f.driver }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.pump.trim()) return;
    const orderedLiters = Number(form.orderedLiters) || 0;
    const unloadedLiters = Number(form.unloadedLiters) || 0;

    if (editingId) {
      setDeliveries((prev) =>
        prev.map((d) =>
          d.id === editingId
            ? {
                ...d,
                tanker: form.tanker,
                driver: form.driver,
                fuelType: form.fuelType,
                pump: form.pump.trim(),
                route: form.route.trim() || d.route,
                orderedLiters,
                unloadedLiters,
                departedDepot: form.departedDepot.trim() || d.departedDepot,
                arrivedPump: form.arrivedPump.trim() || null,
                date: form.date,
                status: form.status,
              }
            : d,
        ),
      );
    } else {
      const newDelivery: Delivery = {
        id: `DEL-${2300 + deliveries.length + 1}`,
        tanker: form.tanker,
        driver: form.driver,
        fuelType: form.fuelType,
        depot: DEPOT,
        pump: form.pump.trim(),
        route: form.route.trim() || `${DEPOT} → ${form.pump.trim()}`,
        orderedLiters,
        unloadedLiters,
        departedDepot: form.departedDepot.trim() || "—",
        arrivedPump: form.arrivedPump.trim() || null,
        date: form.date,
        status: form.status,
      };
      setDeliveries((prev) => [newDelivery, ...prev]);
    }

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Records"
        description="Complete trip records — departure, route, arrival and litres delivered."
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            <PlusIcon className="size-3.5" />
            Add Record
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total records" value={String(deliveries.length)} icon={ClipboardIcon} />
        <StatCard label="Delivered" value={String(delivered.length)} trend="up" delta="On record" />
        <StatCard label="Delayed / cancelled" value={String(delayedOrCancelled)} trend="down" delta="Needs review" />
        <StatCard
          label="Avg. discrepancy"
          value={`${avgDiscrepancy >= 0 ? "+" : ""}${Math.round(avgDiscrepancy)} L`}
          hint="unloaded vs. ordered"
        />
      </div>

      <SectionCard
        title="All deliveries"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("delivery-records", filtered.map((d) => ({
                ID: d.id,
                Tanker: d.tanker,
                Driver: d.driver,
                Pump: d.pump,
                "Fuel Type": FUEL_TYPE_LABELS[d.fuelType],
                "Ordered (L)": d.orderedLiters,
                "Unloaded (L)": d.unloadedLiters,
                "Departed Depot": d.departedDepot,
                "Arrived Pump": d.arrivedPump ?? "—",
                Date: d.date,
                Status: d.status,
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search delivery ID, tanker or pump…" />
          <FilterSelect value={status} onChange={setStatus} options={STATUSES} label="Status" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Delivery</th>
                <th className="px-5 py-3 font-medium">Route</th>
                <th className="px-5 py-3 font-medium">Ordered</th>
                <th className="px-5 py-3 font-medium">Unloaded</th>
                <th className="px-5 py-3 font-medium">Discrepancy</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((d) => {
                const discrepancy = d.unloadedLiters - d.orderedLiters;
                return (
                  <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">{d.id}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{d.tanker} · {d.driver}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">Depot → {d.pump}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{d.orderedLiters.toLocaleString()} L</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {d.status === "Delivered" ? `${d.unloadedLiters.toLocaleString()} L` : "—"}
                    </td>
                    <td className="px-5 py-3">
                      {d.status === "Delivered" ? (
                        <span
                          className={
                            discrepancy < 0
                              ? "font-medium text-rose-600 dark:text-rose-400"
                              : discrepancy > 0
                                ? "font-medium text-emerald-600 dark:text-emerald-400"
                                : "text-slate-500"
                          }
                        >
                          {discrepancy > 0 ? "+" : ""}
                          {discrepancy.toLocaleString()} L
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Badge>{d.status}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(d)}
                        aria-label={`Edit ${d.id}`}
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
                    No deliveries match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {filtered.length} of {deliveries.length} deliveries
        </p>
      </SectionCard>

      {showForm && (
        <Modal title={editingId ? "Edit Delivery Record" : "Add Delivery Record"} onClose={() => setShowForm(false)}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Tanker</label>
                <select
                  value={form.tanker}
                  onChange={(e) => handleTankerChange(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {TANKERS.map((t) => (
                    <option key={t.id} value={t.id}>{t.id}</option>
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
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Destination pump</label>
              <input
                required
                value={form.pump}
                onChange={(e) => setForm((f) => ({ ...f, pump: e.target.value }))}
                placeholder="e.g. Pump 3"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Route</label>
              <input
                value={form.route}
                onChange={(e) => setForm((f) => ({ ...f, route: e.target.value }))}
                placeholder="e.g. Central Depot → Kohat Road → Pump 3"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
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
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Unloaded (L)</label>
                <input
                  type="number"
                  min={0}
                  value={form.unloadedLiters}
                  onChange={(e) => setForm((f) => ({ ...f, unloadedLiters: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Departed depot</label>
                <input
                  value={form.departedDepot}
                  onChange={(e) => setForm((f) => ({ ...f, departedDepot: e.target.value }))}
                  placeholder="e.g. 6:00 AM"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Arrived pump</label>
                <input
                  value={form.arrivedPump}
                  onChange={(e) => setForm((f) => ({ ...f, arrivedPump: e.target.value }))}
                  placeholder="e.g. 9:40 AM"
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
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as DeliveryStatus }))}
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
              {editingId ? "Save Changes" : "Add Record"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
