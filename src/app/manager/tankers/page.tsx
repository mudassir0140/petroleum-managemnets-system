"use client";

import { useMemo, useState } from "react";
import { PlusIcon, TruckIcon } from "@/components/icons";
import { TripStatusBadge } from "@/components/ops/badge";
import { FilterBar } from "@/components/ops/filter-controls";
import { FormField, inputClass, Modal } from "@/components/ops/modal";
import { PageHeader } from "@/components/ops/page-header";
import { SectionCard } from "@/components/ops/section-card";
import { StatCard } from "@/components/ops/stat-card";
import { TankerFleetMap } from "@/components/ops/tanker-fleet-map";
import { DRIVERS, driverById, TANKERS, tankerById } from "@/lib/data/fleet";
import { pumpById, PUMPS } from "@/lib/data/pumps";
import { deriveRoutes, MAP_POINTS } from "@/lib/data/tanker-map";
import { formatLiters } from "@/lib/format";
import { useTankerTrips } from "@/lib/store/use-tanker-trips";
import type { TankerTrip, TripStatus } from "@/lib/types";

const PRODUCTS = ["Petrol", "Diesel", "Premium"];

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "scheduled", label: "Scheduled" },
  { value: "in-transit", label: "In Transit" },
  { value: "delayed", label: "Delayed" },
  { value: "arrived", label: "Arrived" },
  { value: "delivered", label: "Delivered" },
];

const NEXT_STATUS: Partial<Record<TripStatus, { label: string; next: TripStatus }>> = {
  scheduled: { label: "Mark departed", next: "in-transit" },
  "in-transit": { label: "Mark arrived", next: "arrived" },
  delayed: { label: "Mark arrived", next: "arrived" },
};

export default function TankerDispatchPage() {
  const { trips, addTrip, updateTripStatus, confirmDelivery } = useTankerTrips();
  const routes = useMemo(() => deriveRoutes(trips), [trips]);
  const [status, setStatus] = useState("all");
  const [pumpFilter, setPumpFilter] = useState("all");
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const [form, setForm] = useState({
    tankerId: TANKERS[0]?.id ?? "",
    driverId: DRIVERS[0]?.id ?? "",
    destinationPumpId: PUMPS[0]?.id ?? "",
    product: "Diesel",
    quantityLiters: "8000",
    departureTime: "Today, 03:00 PM",
    expectedArrival: "Today, 05:30 PM",
  });

  const filtered = useMemo(() => {
    return trips.filter((trip) => {
      const matchesStatus = status === "all" || trip.status === status;
      const matchesPump = pumpFilter === "all" || trip.destinationPumpId === pumpFilter;
      return matchesStatus && matchesPump;
    });
  }, [trips, status, pumpFilter]);

  const inTransitCount = trips.filter((t) => t.status === "in-transit").length;
  const delayedCount = trips.filter((t) => t.status === "delayed").length;
  const deliveredTodayCount = trips.filter(
    (t) => t.status === "delivered" && t.departureTime.startsWith("Today"),
  ).length;

  function handleSchedule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trip: TankerTrip = {
      id: `trip-${Date.now()}`,
      tankerId: form.tankerId,
      driverId: form.driverId,
      originDepot: "Lucknow Central Depot",
      destinationPumpId: form.destinationPumpId,
      product: form.product,
      quantityLiters: Number(form.quantityLiters) || 0,
      departureTime: form.departureTime,
      expectedArrival: form.expectedArrival,
      actualArrival: null,
      status: "scheduled",
      deliveryConfirmed: false,
    };
    addTrip(trip);
    setScheduleOpen(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tanker Fleet & Live Tracking"
        description="Live map of every tanker between the depot and each pump, plus dispatch scheduling and delivery confirmation."
        actions={
          <button
            type="button"
            onClick={() => setScheduleOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            <PlusIcon className="size-4" />
            Schedule a trip
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="In transit" value={String(inTransitCount)} icon={TruckIcon} tone="sky" />
        <StatCard label="Delayed" value={String(delayedCount)} icon={TruckIcon} tone="rose" />
        <StatCard
          label="Delivered today"
          value={String(deliveredTodayCount)}
          icon={TruckIcon}
          tone="emerald"
        />
      </div>

      <SectionCard
        title="Live tanker tracking"
        description="Company depot to pump routes — green in transit for delivery, orange returning to the depot."
      >
        <TankerFleetMap points={MAP_POINTS} routes={routes} tankerById={tankerById} driverById={driverById} />
      </SectionCard>

      <SectionCard noPadding>
        <div className="border-b border-slate-100 p-5 dark:border-slate-800">
          <FilterBar
            filters={[
              {
                key: "status",
                label: "Filter by status",
                value: status,
                options: STATUS_OPTIONS,
                onChange: setStatus,
              },
              {
                key: "pump",
                label: "Filter by pump",
                value: pumpFilter,
                options: [
                  { value: "all", label: "All destination pumps" },
                  ...PUMPS.map((p) => ({ value: p.id, label: p.name })),
                ],
                onChange: setPumpFilter,
              },
            ]}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Tanker / Driver</th>
                <th className="px-5 py-3 font-medium">Destination</th>
                <th className="px-5 py-3 font-medium">Product / Qty</th>
                <th className="px-5 py-3 font-medium">Departure</th>
                <th className="px-5 py-3 font-medium">Expected arrival</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((trip) => {
                const tanker = tankerById(trip.tankerId);
                const driver = driverById(trip.driverId);
                const destination = pumpById(trip.destinationPumpId);
                const action = NEXT_STATUS[trip.status];
                return (
                  <tr key={trip.id}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {tanker?.regNumber}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{driver?.name}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {destination?.name}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {trip.product} · {formatLiters(trip.quantityLiters)}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {trip.departureTime}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {trip.actualArrival ?? trip.expectedArrival}
                      {trip.actualArrival && (
                        <span className="ml-1 text-xs text-emerald-600 dark:text-emerald-400">
                          (actual)
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <TripStatusBadge status={trip.status} />
                      {trip.notes && (
                        <p className="mt-1 max-w-[16rem] text-xs text-slate-400">{trip.notes}</p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {trip.status === "arrived" && !trip.deliveryConfirmed ? (
                        <button
                          type="button"
                          onClick={() => confirmDelivery(trip.id)}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500"
                        >
                          Confirm delivery
                        </button>
                      ) : action ? (
                        <button
                          type="button"
                          onClick={() =>
                            updateTripStatus(
                              trip.id,
                              action.next,
                              action.next === "arrived" ? "Today" : undefined,
                            )
                          }
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          {action.label}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">
                          {trip.status === "delivered" ? "Confirmed" : "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    No tanker trips match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <Modal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        title="Schedule a tanker trip"
        description="Assign a tanker and driver to deliver fuel to a pump."
        wide
      >
        <form onSubmit={handleSchedule} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Select tanker">
            <select
              className={inputClass}
              value={form.tankerId}
              onChange={(e) => setForm((f) => ({ ...f, tankerId: e.target.value }))}
            >
              {TANKERS.map((tanker) => (
                <option key={tanker.id} value={tanker.id}>
                  {tanker.regNumber} · {formatLiters(tanker.capacityLiters)} ({tanker.status})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Assign driver">
            <select
              className={inputClass}
              value={form.driverId}
              onChange={(e) => setForm((f) => ({ ...f, driverId: e.target.value }))}
            >
              {DRIVERS.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name} ({driver.status})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Destination pump">
            <select
              className={inputClass}
              value={form.destinationPumpId}
              onChange={(e) => setForm((f) => ({ ...f, destinationPumpId: e.target.value }))}
            >
              {PUMPS.map((pump) => (
                <option key={pump.id} value={pump.id}>
                  {pump.name} · {pump.code}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Product">
            <select
              className={inputClass}
              value={form.product}
              onChange={(e) => setForm((f) => ({ ...f, product: e.target.value }))}
            >
              {PRODUCTS.map((product) => (
                <option key={product} value={product}>
                  {product}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Quantity (liters)">
            <input
              type="number"
              min={500}
              step={100}
              className={inputClass}
              value={form.quantityLiters}
              onChange={(e) => setForm((f) => ({ ...f, quantityLiters: e.target.value }))}
            />
          </FormField>

          <FormField label="Departure time">
            <input
              type="text"
              className={inputClass}
              value={form.departureTime}
              onChange={(e) => setForm((f) => ({ ...f, departureTime: e.target.value }))}
              placeholder="Today, 03:00 PM"
            />
          </FormField>

          <FormField label="Expected arrival">
            <input
              type="text"
              className={inputClass}
              value={form.expectedArrival}
              onChange={(e) => setForm((f) => ({ ...f, expectedArrival: e.target.value }))}
              placeholder="Today, 05:30 PM"
            />
          </FormField>

          <div className="flex items-end">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Origin: Lucknow Central Depot
            </p>
          </div>

          <div className="col-span-full flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setScheduleOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              Schedule trip
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
