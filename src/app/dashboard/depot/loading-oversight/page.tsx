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
  LOADING_BAYS,
  LOADING_ORDERS,
  type LoadingOrder,
  type LoadingStatus,
} from "@/lib/dashboard/data/loading";
import { TANKERS } from "@/lib/dashboard/data/tankers";
import { FUEL_TYPES, FUEL_TYPE_LABELS } from "@/lib/dashboard/data/stations";
import type { FuelType } from "@/lib/dashboard/data/stations";

const PRE_DISPATCH_STATUSES: LoadingStatus[] = ["Awaiting Loading", "Loading In Progress", "Loaded"];
const STATUSES: LoadingStatus[] = ["Awaiting Loading", "Loading In Progress", "Loaded"];

type LoadingFormState = {
  tankerId: string;
  driver: string;
  fuelType: FuelType;
  orderedLiters: string;
  bay: string;
  scheduledDate: string;
  startTime: string;
  status: LoadingStatus;
  notes: string;
};

function emptyForm(): LoadingFormState {
  const tanker = TANKERS[0];
  return {
    tankerId: tanker?.id ?? "",
    driver: tanker?.driver ?? "",
    fuelType: "petrol",
    orderedLiters: "",
    bay: LOADING_BAYS[0],
    scheduledDate: new Date().toISOString().slice(0, 10),
    startTime: "",
    status: "Awaiting Loading",
    notes: "",
  };
}

function formFromOrder(order: LoadingOrder): LoadingFormState {
  return {
    tankerId: order.tankerId,
    driver: order.driver,
    fuelType: order.fuelType,
    orderedLiters: String(order.orderedLiters),
    bay: order.bay === "—" ? LOADING_BAYS[0] : order.bay,
    scheduledDate: order.scheduledDate,
    startTime: order.startTime ?? "",
    status: order.status,
    notes: order.notes,
  };
}

export default function DepotLoadingOversightPage() {
  const [orders, setOrders] = useState<LoadingOrder[]>(LOADING_ORDERS);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [bay, setBay] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LoadingFormState>(emptyForm());

  const pipeline = useMemo(
    () => orders.filter((o) => PRE_DISPATCH_STATUSES.includes(o.status)),
    [orders],
  );

  const filtered = useMemo(() => {
    return pipeline.filter((o) => {
      const matchesSearch =
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.tankerId.toLowerCase().includes(search.toLowerCase()) ||
        o.driver.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === "All" || o.status === status;
      const matchesBay = bay === "All" || o.bay === bay;
      return matchesSearch && matchesStatus && matchesBay;
    });
  }, [pipeline, search, status, bay]);

  const awaiting = pipeline.filter((o) => o.status === "Awaiting Loading").length;
  const inProgress = pipeline.filter((o) => o.status === "Loading In Progress").length;
  const loadedAwaitingVerification = pipeline.filter((o) => o.status === "Loaded").length;
  const baysOccupied = new Set(pipeline.filter((o) => o.status === "Loading In Progress").map((o) => o.bay)).size;

  function openAdd() {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(order: LoadingOrder) {
    setForm(formFromOrder(order));
    setEditingId(order.id);
    setShowForm(true);
  }

  function handleTankerChange(tankerId: string) {
    const tanker = TANKERS.find((t) => t.id === tankerId);
    setForm((f) => ({ ...f, tankerId, driver: tanker?.driver ?? f.driver }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const orderedLiters = Number(form.orderedLiters) || 0;
    if (orderedLiters <= 0) return;

    if (editingId) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === editingId
            ? {
                ...o,
                tankerId: form.tankerId,
                driver: form.driver,
                fuelType: form.fuelType,
                orderedLiters,
                bay: form.bay,
                scheduledDate: form.scheduledDate,
                startTime: form.startTime.trim() || (o.status !== "Awaiting Loading" ? o.startTime : null),
                status: form.status,
                notes: form.notes.trim(),
              }
            : o,
        ),
      );
    } else {
      const newOrder: LoadingOrder = {
        id: `LOAD-${4000 + orders.length + 1}`,
        tankerId: form.tankerId,
        driver: form.driver,
        fuelType: form.fuelType,
        orderedLiters,
        loadedLiters: null,
        bay: form.bay,
        scheduledDate: form.scheduledDate,
        startTime: form.startTime.trim() || null,
        endTime: null,
        status: form.status,
        verifiedBy: null,
        notes: form.notes.trim(),
      };
      setOrders((prev) => [newOrder, ...prev]);
    }

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tanker Loading Oversight"
        description="Tankers moving through the loading bays before dispatch — schedule, track progress and bay assignment."
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
        <StatCard label="In loading pipeline" value={String(pipeline.length)} icon={TruckIcon} hint="Before dispatch" />
        <StatCard label="Awaiting loading" value={String(awaiting)} />
        <StatCard label="Loading in progress" value={String(inProgress)} trend="up" delta="Live" />
        <StatCard label="Loaded — awaiting verification" value={String(loadedAwaitingVerification)} hint={`${baysOccupied} of ${LOADING_BAYS.length} bays busy`} />
      </div>

      <SectionCard
        title="Loading pipeline"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("tanker-loading-oversight", filtered.map((o) => ({
                ID: o.id,
                Tanker: o.tankerId,
                Driver: o.driver,
                "Fuel Type": FUEL_TYPE_LABELS[o.fuelType],
                "Ordered (L)": o.orderedLiters,
                Bay: o.bay,
                "Scheduled Date": o.scheduledDate,
                "Start Time": o.startTime ?? "—",
                Status: o.status,
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search loading ID, tanker or driver…" />
          <FilterSelect value={bay} onChange={setBay} options={LOADING_BAYS} label="Bay" />
          <FilterSelect value={status} onChange={setStatus} options={STATUSES} label="Status" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Loading order</th>
                <th className="px-5 py-3 font-medium">Tanker / Driver</th>
                <th className="px-5 py-3 font-medium">Ordered</th>
                <th className="px-5 py-3 font-medium">Bay</th>
                <th className="px-5 py-3 font-medium">Scheduled</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{o.id}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    <p>{o.tankerId}</p>
                    <p className="text-xs text-slate-400">{o.driver}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {o.orderedLiters.toLocaleString()} L
                    <span className="block text-xs text-slate-400">{FUEL_TYPE_LABELS[o.fuelType]}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{o.bay}</td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                    {o.scheduledDate}{o.startTime ? ` · ${o.startTime}` : ""}
                  </td>
                  <td className="px-5 py-3">
                    <Badge>{o.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(o)}
                      aria-label={`Edit ${o.id}`}
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
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No loading orders match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {filtered.length} of {pipeline.length} tankers in the pre-dispatch pipeline
        </p>
      </SectionCard>

      {showForm && (
        <Modal title={editingId ? "Edit Loading Order" : "Schedule Loading"} onClose={() => setShowForm(false)}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Tanker</label>
                <select
                  value={form.tankerId}
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Ordered quantity (L)</label>
                <input
                  required
                  type="number"
                  min={1}
                  value={form.orderedLiters}
                  onChange={(e) => setForm((f) => ({ ...f, orderedLiters: e.target.value }))}
                  placeholder="e.g. 15000"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Loading bay</label>
                <select
                  value={form.bay}
                  onChange={(e) => setForm((f) => ({ ...f, bay: e.target.value }))}
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
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Scheduled date</label>
                <input
                  required
                  type="date"
                  value={form.scheduledDate}
                  onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Start time</label>
                <input
                  value={form.startTime}
                  onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                  placeholder="e.g. 6:00 AM"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as LoadingStatus }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                placeholder="Optional notes for this loading order…"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
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
