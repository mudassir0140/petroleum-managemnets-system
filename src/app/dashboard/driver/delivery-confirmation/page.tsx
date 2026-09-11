"use client";

import { useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { DetailChain, DetailRow, Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { CheckCircleIcon } from "@/components/icons";
import { DEMO_DRIVER, DRIVER_TRIPS, type DriverTrip } from "@/lib/dashboard/data/driver-trips";

export default function DeliveryConfirmationPage() {
  const [trips, setTrips] = useState<DriverTrip[]>(DRIVER_TRIPS);
  const [confirming, setConfirming] = useState<DriverTrip | null>(null);
  const [note, setNote] = useState("");

  const confirmedCount = trips.filter((t) => t.deliveryConfirmed).length;
  const readyToConfirm = trips.filter(
    (t) => t.status === "In Transit" && t.actualArrival && !t.deliveryConfirmed,
  );
  const totalDeliveredLiters = trips
    .filter((t) => t.deliveryConfirmed)
    .reduce((sum, t) => sum + t.unloadedLiters, 0);

  function openConfirm(trip: DriverTrip) {
    setConfirming(trip);
    setNote("");
  }

  function handleConfirm(event: React.FormEvent) {
    event.preventDefault();
    if (!confirming) return;
    setTrips((prev) =>
      prev.map((t) =>
        t.id === confirming.id
          ? { ...t, status: "Delivered", deliveryConfirmed: true, confirmationNote: note || "Delivery confirmed by driver." }
          : t,
      ),
    );
    setConfirming(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Route & Delivery Confirmation"
        description={`Full route per trip, and final delivery confirmation for ${DEMO_DRIVER}.`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Confirmed deliveries" value={String(confirmedCount)} icon={CheckCircleIcon} />
        <StatCard label="Ready to confirm" value={String(readyToConfirm.length)} trend={readyToConfirm.length > 0 ? "down" : "up"} delta={readyToConfirm.length > 0 ? "Action needed" : "All clear"} />
        <StatCard label="Total delivered" value={`${totalDeliveredLiters.toLocaleString()} L`} />
        <StatCard label="Total trips" value={String(trips.length)} />
      </div>

      <div className="space-y-4">
        {trips.map((trip) => (
          <SectionCard key={trip.id} title={`${trip.id} — ${trip.pump}`} description={trip.date}>
            <div className="space-y-4">
              <DetailChain steps={[trip.depot, "Depart", "En route", "Arrive", trip.pump.split(",")[0]]} />
              <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                <div>
                  <DetailRow label="Route" value={trip.route} />
                  <DetailRow label="Tanker" value={trip.tanker} />
                  <DetailRow label="Actual arrival" value={trip.actualArrival ?? "Not yet arrived"} />
                </div>
                <div>
                  <DetailRow label="Status" value={<Badge>{trip.status}</Badge>} />
                  <DetailRow
                    label="Delivery confirmed"
                    value={trip.deliveryConfirmed ? <Badge tone="success">Confirmed</Badge> : <Badge tone="warning">Pending</Badge>}
                  />
                  {trip.confirmationNote && <DetailRow label="Note" value={trip.confirmationNote} />}
                </div>
              </div>
              {trip.status === "In Transit" && trip.actualArrival && !trip.deliveryConfirmed && (
                <button
                  type="button"
                  onClick={() => openConfirm(trip)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
                >
                  <CheckCircleIcon className="size-3.5" />
                  Confirm Delivery
                </button>
              )}
              {trip.status === "In Transit" && !trip.actualArrival && (
                <p className="text-xs text-slate-400">Log the arrival time before confirming delivery.</p>
              )}
            </div>
          </SectionCard>
        ))}
      </div>

      {confirming && (
        <Modal title="Confirm Delivery" subtitle={`${confirming.id} — ${confirming.pump}`} onClose={() => setConfirming(null)}>
          <form className="space-y-4" onSubmit={handleConfirm}>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Confirming marks this trip as delivered. Add any notes on quantity, condition or pump owner sign-off.
            </p>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Confirmation note</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="e.g. Full quantity delivered, pump owner signed off."
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              Confirm Delivery
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
