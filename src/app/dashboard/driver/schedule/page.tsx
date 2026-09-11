"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { DetailChain, DetailRow, Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { CalendarIcon } from "@/components/icons";
import { DEMO_DRIVER, DRIVER_TRIPS, type DriverTrip } from "@/lib/dashboard/data/driver-trips";
import { FUEL_TYPE_LABELS } from "@/lib/dashboard/data/stations";

const STATUSES = ["Scheduled", "In Transit", "Delivered", "Delayed"];

export default function TripSchedulePage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [selected, setSelected] = useState<DriverTrip | null>(null);

  const trips = useMemo(
    () => [...DRIVER_TRIPS].sort((a, b) => a.date.localeCompare(b.date)),
    [],
  );

  const filtered = trips.filter((trip) => {
    const matchesSearch =
      trip.pump.toLowerCase().includes(search.toLowerCase()) || trip.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === "All" || trip.status === status;
    return matchesSearch && matchesStatus;
  });

  const scheduledCount = trips.filter((t) => t.status === "Scheduled").length;
  const inTransitCount = trips.filter((t) => t.status === "In Transit").length;
  const deliveredCount = trips.filter((t) => t.status === "Delivered").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trip Schedule"
        description={`Assigned trips for ${DEMO_DRIVER} — this week.`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total trips" value={String(trips.length)} icon={CalendarIcon} hint="this week" />
        <StatCard label="Scheduled" value={String(scheduledCount)} />
        <StatCard label="In transit" value={String(inTransitCount)} trend="up" delta="Live" />
        <StatCard label="Delivered" value={String(deliveredCount)} />
      </div>

      <SectionCard title="My trips" description="Click a trip for full route and load details">
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search trip ID or pump…" />
          <FilterSelect value={status} onChange={setStatus} options={STATUSES} label="Status" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Trip</th>
                <th className="px-5 py-3 font-medium">Destination</th>
                <th className="px-5 py-3 font-medium">Fuel</th>
                <th className="px-5 py-3 font-medium">Scheduled departure</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((trip) => (
                <tr
                  key={trip.id}
                  onClick={() => setSelected(trip)}
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{trip.date}</td>
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{trip.id}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{trip.pump}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{FUEL_TYPE_LABELS[trip.fuelType]}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{trip.scheduledDeparture}</td>
                  <td className="px-5 py-3">
                    <Badge>{trip.status}</Badge>
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

      {selected && (
        <Modal title={selected.id} subtitle={`${selected.tanker} · ${selected.date}`} onClose={() => setSelected(null)}>
          <div className="mb-4">
            <DetailChain steps={[selected.depot, "Load", "Depart", selected.pump.split(",")[0], "Unload"]} />
          </div>
          <DetailRow label="Route" value={selected.route} />
          <DetailRow label="Fuel type" value={FUEL_TYPE_LABELS[selected.fuelType]} />
          <DetailRow label="Scheduled departure" value={selected.scheduledDeparture} />
          <DetailRow label="Expected arrival" value={selected.expectedArrival} />
          <DetailRow label="Status" value={<Badge>{selected.status}</Badge>} />
        </Modal>
      )}
    </div>
  );
}
