"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { DetailRow, Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { EditIcon, TruckIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import { TRIPS, type Trip } from "@/lib/dashboard/data/trips";
import { FUEL_TYPE_LABELS } from "@/lib/dashboard/data/stations";

const TRACKED_STATUSES = ["Assigned", "Departed", "Arrived"] as const;

type TrackFormState = { time: string };

function nowTime() {
  return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function DispatchTrackDepartureArrivalPage() {
  const [trips, setTrips] = useState<Trip[]>(TRIPS);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("All");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TrackFormState>({ time: nowTime() });

  const tracked = useMemo(
    () => trips.filter((t) => TRACKED_STATUSES.includes(t.status as (typeof TRACKED_STATUSES)[number])),
    [trips],
  );

  const filtered = useMemo(() => {
    return tracked.filter((t) => {
      const matchesSearch =
        t.id.toLowerCase().includes(search.toLowerCase()) ||
        t.tankerId.toLowerCase().includes(search.toLowerCase()) ||
        (t.driver ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === "All" || t.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [tracked, search, status]);

  const readyToDepart = tracked.filter((t) => t.status === "Assigned").length;
  const inTransit = tracked.filter((t) => t.status === "Departed").length;
  const arrivedToday = tracked.filter((t) => t.status === "Arrived").length;

  const editing = editingId ? trips.find((t) => t.id === editingId) ?? null : null;
  const nextAction = editing?.status === "Assigned" ? "depart" : editing?.status === "Departed" ? "arrive" : null;

  function openAction(trip: Trip) {
    setForm({ time: nowTime() });
    setEditingId(trip.id);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!editingId || !nextAction) return;
    const time = form.time.trim();
    if (!time) return;

    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== editingId) return t;
        if (nextAction === "depart") {
          return { ...t, status: "Departed", departureTime: time };
        }
        return { ...t, status: "Arrived", arrivalTime: time };
      }),
    );
    setEditingId(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Track Departure & Confirm Arrival"
        description="Mark tankers as departed from the depot and confirm arrival at the destination pump."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Ready to depart" value={String(readyToDepart)} icon={TruckIcon} />
        <StatCard label="In transit" value={String(inTransit)} trend="up" delta="Live" />
        <StatCard label="Arrived" value={String(arrivedToday)} trend="up" delta="Confirmed" />
        <StatCard label="Trips tracked" value={String(tracked.length)} />
      </div>

      <SectionCard
        title="Departure & arrival tracking"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("track-departure-arrival", filtered.map((t) => ({
                Trip: t.id,
                Tanker: t.tankerId,
                Driver: t.driver ?? "—",
                "Destination Pump": t.destinationPump ?? "—",
                "Departure Time": t.departureTime ?? "—",
                "Arrival Time": t.arrivalTime ?? "—",
                Status: t.status,
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search trip ID, tanker or driver…" />
          <FilterSelect value={status} onChange={setStatus} options={[...TRACKED_STATUSES]} label="Status" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Trip</th>
                <th className="px-5 py-3 font-medium">Tanker / Driver</th>
                <th className="px-5 py-3 font-medium">Destination</th>
                <th className="px-5 py-3 font-medium">Departed</th>
                <th className="px-5 py-3 font-medium">Arrived</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{t.id}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    <p>{t.tankerId}</p>
                    <p className="text-xs text-slate-400">{t.driver ?? "—"}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{t.destinationPump ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{t.departureTime ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{t.arrivalTime ?? "—"}</td>
                  <td className="px-5 py-3">
                    <Badge>{t.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {t.status === "Arrived" ? (
                      <span className="text-xs text-slate-400">Complete</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openAction(t)}
                        aria-label={t.status === "Assigned" ? `Mark ${t.id} departed` : `Confirm ${t.id} arrival`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <EditIcon className="size-3.5" />
                        {t.status === "Assigned" ? "Mark Departed" : "Confirm Arrival"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No trips match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {filtered.length} of {tracked.length} assigned trips
        </p>
      </SectionCard>

      {editing && nextAction && (
        <Modal
          title={nextAction === "depart" ? `Mark ${editing.id} Departed` : `Confirm ${editing.id} Arrival`}
          subtitle={`${editing.tankerId} · ${editing.driver} → ${editing.destinationPump}`}
          onClose={() => setEditingId(null)}
        >
          <form className="space-y-4" onSubmit={handleSubmit}>
            <DetailRow label="Quantity" value={`${editing.quantity.toLocaleString()} L ${FUEL_TYPE_LABELS[editing.fuelType]}`} />
            {nextAction === "arrive" && <DetailRow label="Departed at" value={editing.departureTime ?? "—"} />}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                {nextAction === "depart" ? "Departure time" : "Arrival time"}
              </label>
              <input
                required
                autoFocus
                value={form.time}
                onChange={(e) => setForm({ time: e.target.value })}
                placeholder="e.g. 6:15 AM"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              {nextAction === "depart" ? "Confirm Departure" : "Confirm Arrival"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
