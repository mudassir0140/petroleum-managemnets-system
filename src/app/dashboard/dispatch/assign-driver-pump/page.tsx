"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { EditIcon, UsersIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import { TRIPS, type Trip } from "@/lib/dashboard/data/trips";
import { DRIVERS } from "@/lib/dashboard/data/drivers";
import { PUMPS } from "@/lib/dashboard/data/pumps";
import { FUEL_TYPE_LABELS } from "@/lib/dashboard/data/stations";

const ASSIGNMENT_STATUSES = ["Scheduled", "Assigned"] as const;
const DESTINATION_OPTIONS = PUMPS.map((p) => `Pump ${p.number} — ${p.city}`);

type AssignFormState = { driver: string; destinationPump: string };

export default function DispatchAssignDriverPumpPage() {
  const [trips, setTrips] = useState<Trip[]>(TRIPS);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("All");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AssignFormState>({ driver: DRIVERS[0]?.name ?? "", destinationPump: DESTINATION_OPTIONS[0] ?? "" });

  const assignable = useMemo(
    () => trips.filter((t) => ASSIGNMENT_STATUSES.includes(t.status as (typeof ASSIGNMENT_STATUSES)[number])),
    [trips],
  );

  const filtered = useMemo(() => {
    return assignable.filter((t) => {
      const matchesSearch =
        t.id.toLowerCase().includes(search.toLowerCase()) ||
        t.tankerId.toLowerCase().includes(search.toLowerCase()) ||
        (t.driver ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === "All" || t.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [assignable, search, status]);

  const unassigned = assignable.filter((t) => t.status === "Scheduled").length;
  const assigned = assignable.filter((t) => t.status === "Assigned").length;
  const onDutyDrivers = DRIVERS.filter((d) => d.status === "On Duty").length;

  const editing = editingId ? trips.find((t) => t.id === editingId) ?? null : null;

  function openAssign(trip: Trip) {
    setForm({
      driver: trip.driver ?? DRIVERS[0]?.name ?? "",
      destinationPump: trip.destinationPump ?? DESTINATION_OPTIONS[0] ?? "",
    });
    setEditingId(trip.id);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!editingId || !form.driver || !form.destinationPump) return;

    setTrips((prev) =>
      prev.map((t) =>
        t.id === editingId
          ? { ...t, driver: form.driver, destinationPump: form.destinationPump, status: "Assigned" }
          : t,
      ),
    );
    setEditingId(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assign Driver & Destination Pump"
        description="Pair each scheduled trip with a driver and a destination pump before it can depart."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Awaiting assignment" value={String(unassigned)} icon={UsersIcon} trend={unassigned > 0 ? "down" : "up"} delta={unassigned > 0 ? "Needs driver & pump" : "All assigned"} />
        <StatCard label="Assigned — ready to depart" value={String(assigned)} />
        <StatCard label="Drivers on duty" value={String(onDutyDrivers)} hint={`of ${DRIVERS.length} total`} />
        <StatCard label="Trips in this queue" value={String(assignable.length)} />
      </div>

      <SectionCard
        title="Trips to assign"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("assign-driver-pump", filtered.map((t) => ({
                Trip: t.id,
                Tanker: t.tankerId,
                "Fuel Type": FUEL_TYPE_LABELS[t.fuelType],
                "Quantity (L)": t.quantity,
                Driver: t.driver ?? "—",
                "Destination Pump": t.destinationPump ?? "—",
                Status: t.status,
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search trip ID, tanker or driver…" />
          <FilterSelect value={status} onChange={setStatus} options={[...ASSIGNMENT_STATUSES]} label="Status" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Trip</th>
                <th className="px-5 py-3 font-medium">Tanker</th>
                <th className="px-5 py-3 font-medium">Driver</th>
                <th className="px-5 py-3 font-medium">Destination pump</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{t.id}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {t.tankerId}
                    <span className="block text-xs text-slate-400">{t.quantity.toLocaleString()} L {FUEL_TYPE_LABELS[t.fuelType]}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{t.driver ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{t.destinationPump ?? "—"}</td>
                  <td className="px-5 py-3">
                    <Badge>{t.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openAssign(t)}
                      aria-label={`Assign ${t.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <EditIcon className="size-3.5" />
                      {t.status === "Assigned" ? "Reassign" : "Assign"}
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
          Showing {filtered.length} of {assignable.length} trips
        </p>
      </SectionCard>

      {editing && (
        <Modal
          title={`Assign ${editing.id}`}
          subtitle={`${editing.tankerId} · ${editing.quantity.toLocaleString()} L ${FUEL_TYPE_LABELS[editing.fuelType]}`}
          onClose={() => setEditingId(null)}
        >
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Driver</label>
              <select
                value={form.driver}
                onChange={(e) => setForm((f) => ({ ...f, driver: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {DRIVERS.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name} ({d.status})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Destination pump</label>
              <select
                value={form.destinationPump}
                onChange={(e) => setForm((f) => ({ ...f, destinationPump: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {DESTINATION_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              Confirm Assignment
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
