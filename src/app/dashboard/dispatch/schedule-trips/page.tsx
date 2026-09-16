// @ts-nocheck
"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { CalendarIcon, EditIcon, PlusIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import { TRIPS, type Trip, type TripStatus } from "@/lib/dashboard/data/trips";
import { TANKERS } from "@/lib/dashboard/data/tankers";
import { FUEL_TYPES, FUEL_TYPE_LABELS } from "@/lib/dashboard/data/stations";
import type { FuelType } from "@/lib/dashboard/data/stations";

const STATUSES: TripStatus[] = ["Scheduled", "Assigned", "Departed", "Arrived"];

type TripFormState = {
  tankerId: string;
  fuelType: FuelType;
  quantity: string;
  scheduledDate: string;
  scheduledTime: string;
  notes: string;
};

function emptyForm(): TripFormState {
  return {
    tankerId: TANKERS[0]?.id ?? "",
    fuelType: "petrol",
    quantity: "",
    scheduledDate: new Date().toISOString().slice(0, 10),
    scheduledTime: "6:00 AM",
    notes: "",
  };
}

function formFromTrip(trip: Trip): TripFormState {
  return {
    tankerId: trip.tankerId,
    fuelType: trip.fuelType,
    quantity: String(trip.quantity),
    scheduledDate: trip.scheduledDate,
    scheduledTime: trip.scheduledTime,
    notes: trip.notes,
  };
}

export default function DispatchScheduleTripsPage() {
  const [trips, setTrips] = useState<Trip[]>(TRIPS);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TripFormState>(emptyForm());

  const filtered = useMemo(() => {
    return trips.filter((t) => {
      const matchesSearch =
        t.id.toLowerCase().includes(search.toLowerCase()) ||
        t.tankerId.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === "All" || t.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [trips, search, status]);

  const today = new Date().toISOString().slice(0, 10);
  const scheduledToday = trips.filter((t) => t.scheduledDate === today).length;
  const unassigned = trips.filter((t) => t.status === "Scheduled").length;
  const inTransit = trips.filter((t) => t.status === "Departed").length;

  function openAdd() {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(trip: Trip) {
    setForm(formFromTrip(trip));
    setEditingId(trip.id);
    setShowForm(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const quantity = Number(form.quantity) || 0;
    if (quantity <= 0) return;

    if (editingId) {
      setTrips((prev) =>
        prev.map((t) =>
          t.id === editingId
            ? {
                ...t,
                tankerId: form.tankerId,
                fuelType: form.fuelType,
                quantity,
                scheduledDate: form.scheduledDate,
                scheduledTime: form.scheduledTime,
                notes: form.notes.trim(),
              }
            : t,
        ),
      );
    } else {
      const newTrip: Trip = {
        id: `TRIP-${5000 + trips.length + 1}`,
        tankerId: form.tankerId,
        fuelType: form.fuelType,
        quantity,
        scheduledDate: form.scheduledDate,
        scheduledTime: form.scheduledTime,
        driver: null,
        destinationPump: null,
        departureTime: null,
        arrivalTime: null,
        status: "Scheduled",
        notes: form.notes.trim(),
      };
      setTrips((prev) => [newTrip, ...prev]);
    }

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schedule Tanker Trips"
        description="Plan upcoming tanker trips — tanker, fuel type, quantity and scheduled time."
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            <PlusIcon className="size-3.5" />
            Schedule Trip
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total trips" value={String(trips.length)} icon={CalendarIcon} />
        <StatCard label="Scheduled today" value={String(scheduledToday)} />
        <StatCard label="Needs assignment" value={String(unassigned)} trend={unassigned > 0 ? "down" : "up"} delta={unassigned > 0 ? "Driver & pump pending" : "All assigned"} />
        <StatCard label="In transit" value={String(inTransit)} trend="up" delta="Live" />
      </div>

      <SectionCard
        title="All trips"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("scheduled-trips", filtered.map((t) => ({
                Trip: t.id,
                Tanker: t.tankerId,
                "Fuel Type": FUEL_TYPE_LABELS[t.fuelType],
                "Quantity (L)": t.quantity,
                "Scheduled Date": t.scheduledDate,
                "Scheduled Time": t.scheduledTime,
                Driver: t.driver ?? "—",
                "Destination Pump": t.destinationPump ?? "—",
                Status: t.status,
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search trip ID or tanker…" />
          <FilterSelect value={status} onChange={setStatus} options={STATUSES} label="Status" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Trip</th>
                <th className="px-5 py-3 font-medium">Tanker</th>
                <th className="px-5 py-3 font-medium">Quantity</th>
                <th className="px-5 py-3 font-medium">Scheduled</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{t.id}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{t.tankerId}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {t.quantity.toLocaleString()} L
                    <span className="block text-xs text-slate-400">{FUEL_TYPE_LABELS[t.fuelType]}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{t.scheduledDate} · {t.scheduledTime}</td>
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
                    No trips match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {filtered.length} of {trips.length} trips
        </p>
      </SectionCard>

      {showForm && (
        <Modal title={editingId ? "Edit Trip" : "Schedule Trip"} onClose={() => setShowForm(false)}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Tanker</label>
                <select
                  value={form.tankerId}
                  onChange={(e) => setForm((f) => ({ ...f, tankerId: e.target.value }))}
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
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Quantity (L)</label>
              <input
                required
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                placeholder="e.g. 15000"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
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
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Scheduled time</label>
                <input
                  required
                  value={form.scheduledTime}
                  onChange={(e) => setForm((f) => ({ ...f, scheduledTime: e.target.value }))}
                  placeholder="e.g. 6:00 AM"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                placeholder="Optional notes for this trip…"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              {editingId ? "Save Changes" : "Schedule Trip"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
