"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { EditIcon, MapPinIcon, PlusIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import { ROUTES, type LogisticsRoute, type RouteStatus } from "@/lib/dashboard/data/routes";
import { DEPOT, FUEL_TYPES, FUEL_TYPE_LABELS } from "@/lib/dashboard/data/stations";
import type { FuelType } from "@/lib/dashboard/data/stations";

const STATUSES: RouteStatus[] = ["Active", "Under Maintenance", "Seasonal"];

type RouteFormState = {
  name: string;
  to: string;
  highway: string;
  distanceKm: string;
  avgDurationHrs: string;
  fuelTypes: FuelType[];
  status: RouteStatus;
};

function emptyForm(): RouteFormState {
  return { name: "", to: "", highway: "", distanceKm: "", avgDurationHrs: "", fuelTypes: ["petrol"], status: "Active" };
}

function formFromRoute(route: LogisticsRoute): RouteFormState {
  return {
    name: route.name,
    to: route.to,
    highway: route.highway,
    distanceKm: String(route.distanceKm),
    avgDurationHrs: String(route.avgDurationHrs),
    fuelTypes: route.fuelTypes,
    status: route.status,
  };
}

export default function LogisticsRoutesPage() {
  const [routes, setRoutes] = useState<LogisticsRoute[]>(ROUTES);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RouteFormState>(emptyForm());

  const filtered = useMemo(() => {
    return routes.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.to.toLowerCase().includes(search.toLowerCase()) ||
        r.id.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === "All" || r.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [routes, search, status]);

  const active = routes.filter((r) => r.status === "Active").length;
  const totalDistance = routes.reduce((sum, r) => sum + r.distanceKm, 0);
  const avgDuration = routes.reduce((sum, r) => sum + r.avgDurationHrs, 0) / (routes.length || 1);

  function openAdd() {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(route: LogisticsRoute) {
    setForm(formFromRoute(route));
    setEditingId(route.id);
    setShowForm(true);
  }

  function toggleFuelType(fuel: FuelType) {
    setForm((f) => ({
      ...f,
      fuelTypes: f.fuelTypes.includes(fuel)
        ? f.fuelTypes.filter((t) => t !== fuel)
        : [...f.fuelTypes, fuel],
    }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.to.trim()) return;
    const distanceKm = Number(form.distanceKm) || 0;
    const avgDurationHrs = Number(form.avgDurationHrs) || 0;
    const fuelTypes = form.fuelTypes.length > 0 ? form.fuelTypes : (["petrol"] as FuelType[]);

    if (editingId) {
      setRoutes((prev) =>
        prev.map((r) =>
          r.id === editingId
            ? {
                ...r,
                name: form.name.trim(),
                to: form.to.trim(),
                highway: form.highway.trim() || r.highway,
                distanceKm,
                avgDurationHrs,
                fuelTypes,
                status: form.status,
              }
            : r,
        ),
      );
    } else {
      const nextNumber = routes.length + 1;
      const newRoute: LogisticsRoute = {
        id: `RT-${String(nextNumber).padStart(2, "0")}`,
        name: form.name.trim(),
        from: DEPOT,
        to: form.to.trim(),
        highway: form.highway.trim() || "—",
        distanceKm,
        avgDurationHrs,
        fuelTypes,
        status: form.status,
      };
      setRoutes((prev) => [...prev, newRoute]);
    }

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Routes"
        description="Depot-to-pump route catalog — distance, average duration and highways used."
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            <PlusIcon className="size-3.5" />
            Add Route
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total routes" value={String(routes.length)} icon={MapPinIcon} />
        <StatCard label="Active" value={String(active)} trend="up" delta="In service" />
        <StatCard label="Total distance" value={`${totalDistance.toLocaleString()} km`} />
        <StatCard label="Avg. duration" value={`${avgDuration.toFixed(1)} hrs`} />
      </div>

      <SectionCard
        title="All routes"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("routes", filtered.map((r) => ({
                ID: r.id,
                Name: r.name,
                From: r.from,
                To: r.to,
                Highway: r.highway,
                "Distance (km)": r.distanceKm,
                "Avg. Duration (hrs)": r.avgDurationHrs,
                "Fuel Types": r.fuelTypes.map((f) => FUEL_TYPE_LABELS[f]).join(" / "),
                Status: r.status,
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search route name, destination or ID…" />
          <FilterSelect value={status} onChange={setStatus} options={STATUSES} label="Status" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Route</th>
                <th className="px-5 py-3 font-medium">Highway</th>
                <th className="px-5 py-3 font-medium">Distance</th>
                <th className="px-5 py-3 font-medium">Avg. duration</th>
                <th className="px-5 py-3 font-medium">Fuel types</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">{r.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{r.id} · {r.from} → {r.to}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{r.highway}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{r.distanceKm.toLocaleString()} km</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{r.avgDurationHrs} hrs</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {r.fuelTypes.map((f) => FUEL_TYPE_LABELS[f]).join(" / ")}
                  </td>
                  <td className="px-5 py-3">
                    <Badge>{r.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(r)}
                      aria-label={`Edit ${r.name}`}
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
                    No routes match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {filtered.length} of {routes.length} routes
        </p>
      </SectionCard>

      {showForm && (
        <Modal title={editingId ? "Edit Route" : "Add Route"} subtitle={`Starting point: ${DEPOT}`} onClose={() => setShowForm(false)}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Route name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Depot → Karachi"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Destination</label>
              <input
                required
                value={form.to}
                onChange={(e) => setForm((f) => ({ ...f, to: e.target.value }))}
                placeholder="e.g. PSO Pump 1 — Karachi"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Highway / path</label>
              <input
                value={form.highway}
                onChange={(e) => setForm((f) => ({ ...f, highway: e.target.value }))}
                placeholder="e.g. Indus Highway (N-55)"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Distance (km)</label>
                <input
                  required
                  type="number"
                  min={0}
                  value={form.distanceKm}
                  onChange={(e) => setForm((f) => ({ ...f, distanceKm: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Avg. duration (hrs)</label>
                <input
                  required
                  type="number"
                  min={0}
                  step={0.5}
                  value={form.avgDurationHrs}
                  onChange={(e) => setForm((f) => ({ ...f, avgDurationHrs: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Fuel types serviced</label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {FUEL_TYPES.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggleFuelType(f)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      form.fuelTypes.includes(f)
                        ? "border-amber-500 bg-amber-50 text-amber-700 dark:border-amber-500 dark:bg-amber-500/10 dark:text-amber-400"
                        : "border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    {FUEL_TYPE_LABELS[f]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as RouteStatus }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              {editingId ? "Save Changes" : "Add Route"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
