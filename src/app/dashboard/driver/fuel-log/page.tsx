// @ts-nocheck
"use client";

import { useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { DropletIcon, EditIcon } from "@/components/icons";
import { DEMO_DRIVER, DRIVER_TRIPS, type DriverTrip } from "@/lib/dashboard/data/driver-trips";
import { FUEL_TYPE_LABELS } from "@/lib/dashboard/data/stations";

type FuelFormState = { loadedLiters: string; unloadedLiters: string };

export default function FuelLogPage() {
  const [trips, setTrips] = useState<DriverTrip[]>(DRIVER_TRIPS);
  const [editing, setEditing] = useState<DriverTrip | null>(null);
  const [form, setForm] = useState<FuelFormState>({ loadedLiters: "", unloadedLiters: "" });

  const totalLoaded = trips.reduce((sum, t) => sum + t.loadedLiters, 0);
  const totalUnloaded = trips.reduce((sum, t) => sum + t.unloadedLiters, 0);
  const delivered = trips.filter((t) => t.status === "Delivered");
  const avgDiscrepancy =
    delivered.length === 0
      ? 0
      : delivered.reduce((sum, t) => sum + (t.unloadedLiters - t.loadedLiters), 0) / delivered.length;

  function openEdit(trip: DriverTrip) {
    setEditing(trip);
    setForm({
      loadedLiters: String(trip.loadedLiters || ""),
      unloadedLiters: String(trip.unloadedLiters || ""),
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;
    const loadedLiters = Number(form.loadedLiters) || 0;
    const unloadedLiters = Number(form.unloadedLiters) || 0;

    setTrips((prev) =>
      prev.map((t) => (t.id === editing.id ? { ...t, loadedLiters, unloadedLiters } : t)),
    );
    setEditing(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fuel Loaded/Unloaded"
        description={`Litres loaded at the depot and unloaded at the pump for ${DEMO_DRIVER}'s trips.`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total loaded" value={`${totalLoaded.toLocaleString()} L`} icon={DropletIcon} hint="this week" />
        <StatCard label="Total unloaded" value={`${totalUnloaded.toLocaleString()} L`} hint="this week" />
        <StatCard
          label="Avg. discrepancy"
          value={`${avgDiscrepancy >= 0 ? "+" : ""}${Math.round(avgDiscrepancy)} L`}
          trend={avgDiscrepancy < 0 ? "down" : "up"}
          delta="unloaded vs. loaded"
        />
        <StatCard label="Trips logged" value={String(trips.filter((t) => t.loadedLiters > 0).length)} hint={`of ${trips.length}`} />
      </div>

      <SectionCard title="Fuel log" description="Log litres loaded before departure and unloaded on arrival">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Trip</th>
                <th className="px-5 py-3 font-medium">Fuel</th>
                <th className="px-5 py-3 font-medium">Loaded (L)</th>
                <th className="px-5 py-3 font-medium">Unloaded (L)</th>
                <th className="px-5 py-3 font-medium">Discrepancy</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {trips.map((trip) => {
                const discrepancy = trip.unloadedLiters - trip.loadedLiters;
                return (
                  <tr key={trip.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">{trip.id}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{trip.pump}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{FUEL_TYPE_LABELS[trip.fuelType]}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {trip.loadedLiters > 0 ? trip.loadedLiters.toLocaleString() : "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {trip.unloadedLiters > 0 ? trip.unloadedLiters.toLocaleString() : "—"}
                    </td>
                    <td className="px-5 py-3">
                      {trip.loadedLiters > 0 && trip.unloadedLiters > 0 ? (
                        <span
                          className={
                            discrepancy < 0
                              ? "font-medium text-rose-600 dark:text-rose-400"
                              : "text-slate-500 dark:text-slate-400"
                          }
                        >
                          {discrepancy > 0 ? "+" : ""}
                          {discrepancy.toLocaleString()} L
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Badge>{trip.status}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(trip)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <EditIcon className="size-3.5" />
                        Log Fuel
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {editing && (
        <Modal title="Log Fuel Quantity" subtitle={`${editing.id} — ${editing.pump}`} onClose={() => setEditing(null)}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Loaded at depot (litres)</label>
              <input
                type="number"
                min={0}
                value={form.loadedLiters}
                onChange={(e) => setForm((f) => ({ ...f, loadedLiters: e.target.value }))}
                placeholder="e.g. 15000"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Unloaded at pump (litres)</label>
              <input
                type="number"
                min={0}
                value={form.unloadedLiters}
                onChange={(e) => setForm((f) => ({ ...f, unloadedLiters: e.target.value }))}
                placeholder="e.g. 14900"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              Save Fuel Log
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
