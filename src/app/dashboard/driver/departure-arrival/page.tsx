"use client";

import { useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { ClockIcon, EditIcon } from "@/components/icons";
import { DEMO_DRIVER, DRIVER_TRIPS, type DriverTrip } from "@/lib/dashboard/data/driver-trips";

type LogKind = "departure" | "arrival";

function nowLabel() {
  return new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DepartureArrivalPage() {
  const [trips, setTrips] = useState<DriverTrip[]>(DRIVER_TRIPS);
  const [logging, setLogging] = useState<{ trip: DriverTrip; kind: LogKind } | null>(null);
  const [timeValue, setTimeValue] = useState("");

  const pendingDeparture = trips.filter((t) => t.status === "Scheduled").length;
  const pendingArrival = trips.filter((t) => t.status === "In Transit" && !t.actualArrival).length;
  const loggedToday = trips.filter(
    (t) => t.actualDeparture?.startsWith("2026-09-11") || t.actualArrival?.startsWith("2026-09-11"),
  ).length;

  function openLog(trip: DriverTrip, kind: LogKind) {
    setLogging({ trip, kind });
    setTimeValue(nowLabel());
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!logging) return;
    const { trip, kind } = logging;

    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== trip.id) return t;
        if (kind === "departure") {
          return { ...t, actualDeparture: timeValue, status: "In Transit" };
        }
        return { ...t, actualArrival: timeValue };
      }),
    );
    setLogging(null);
    setTimeValue("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Log Departure & Arrival Time"
        description={`Record actual departure and arrival times for ${DEMO_DRIVER}'s trips.`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending departure log" value={String(pendingDeparture)} icon={ClockIcon} />
        <StatCard label="Pending arrival log" value={String(pendingArrival)} trend="down" delta="Awaiting log" />
        <StatCard label="Logged today" value={String(loggedToday)} trend="up" delta="Today" />
        <StatCard label="Total trips" value={String(trips.length)} />
      </div>

      <SectionCard title="Trip timing" description="Log actual times as they happen">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Trip</th>
                <th className="px-5 py-3 font-medium">Scheduled departure</th>
                <th className="px-5 py-3 font-medium">Actual departure</th>
                <th className="px-5 py-3 font-medium">Expected arrival</th>
                <th className="px-5 py-3 font-medium">Actual arrival</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {trips.map((trip) => (
                <tr key={trip.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">{trip.id}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{trip.pump}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{trip.scheduledDeparture}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{trip.actualDeparture ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{trip.expectedArrival}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{trip.actualArrival ?? "—"}</td>
                  <td className="px-5 py-3">
                    <Badge>{trip.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {trip.status === "Scheduled" && (
                      <button
                        type="button"
                        onClick={() => openLog(trip, "departure")}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
                      >
                        <EditIcon className="size-3.5" />
                        Log Departure
                      </button>
                    )}
                    {trip.status === "In Transit" && !trip.actualArrival && (
                      <button
                        type="button"
                        onClick={() => openLog(trip, "arrival")}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
                      >
                        <EditIcon className="size-3.5" />
                        Log Arrival
                      </button>
                    )}
                    {(trip.status === "Delivered" || (trip.status === "In Transit" && trip.actualArrival)) && (
                      <span className="text-xs text-slate-400">Complete</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {logging && (
        <Modal
          title={logging.kind === "departure" ? "Log Departure" : "Log Arrival"}
          subtitle={`${logging.trip.id} — ${logging.trip.pump}`}
          onClose={() => setLogging(null)}
        >
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                {logging.kind === "departure" ? "Actual departure time" : "Actual arrival time"}
              </label>
              <input
                required
                value={timeValue}
                onChange={(e) => setTimeValue(e.target.value)}
                placeholder="e.g. Sep 11, 06:15 AM"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              Save Time
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
