// @ts-nocheck
"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { EditIcon, GaugeIcon, MapPinIcon, PlusIcon, TankIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import { formatCurrency } from "@/lib/dashboard/format";
import { PUMPS } from "@/lib/dashboard/data/pumps";
import { CITIES } from "@/lib/dashboard/data/stations";
import {
  AREA_ASSIGNMENTS,
  CITY_REGIONS,
  pumpsByCity,
  type AreaAssignment,
} from "@/lib/dashboard/data/area";

const CITY_FILTERS = [...CITIES];
const STATUS_FILTERS = ["Online", "Offline", "Maintenance"];
const REGIONS = Array.from(new Set(Object.values(CITY_REGIONS)));

type AssignmentFormState = {
  city: string;
  region: string;
  areaManager: string;
  phone: string;
};

function emptyForm(): AssignmentFormState {
  const defaultCity = CITIES[0] ?? "Unknown";
  return { city: defaultCity, region: CITY_REGIONS[defaultCity] ?? "", areaManager: "", phone: "" };
}

function formFromAssignment(a: AreaAssignment): AssignmentFormState {
  return { city: a.city, region: a.region, areaManager: a.areaManager, phone: a.phone };
}

export default function AssignedPumpsOverviewPage() {
  const [assignments, setAssignments] = useState<AreaAssignment[]>(AREA_ASSIGNMENTS);
  const [pumpSearch, setPumpSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AssignmentFormState>(emptyForm());

  const citySummary = useMemo(() => pumpsByCity() ?? [], []);
  const maxPumpCount = citySummary.length > 0 ? Math.max(...citySummary.map((c) => c.pumpCount), 1) : 1;

  const filteredPumps = useMemo(() => {
    return PUMPS.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(pumpSearch.toLowerCase()) ||
        p.owner.toLowerCase().includes(pumpSearch.toLowerCase()) ||
        p.city.toLowerCase().includes(pumpSearch.toLowerCase());
      const matchesCity = cityFilter === "All" || p.city === cityFilter;
      const matchesStatus = statusFilter === "All" || p.status === statusFilter;
      return matchesSearch && matchesCity && matchesStatus;
    });
  }, [pumpSearch, cityFilter, statusFilter]);

  const needAttention = PUMPS.filter((p) => p.status !== "Online").length;

  function openAdd() {
    setForm(emptyForm());
    setEditingId(null);
    setShowAdd(true);
  }

  function openEdit(assignment: AreaAssignment) {
    setForm(formFromAssignment(assignment));
    setEditingId(assignment.id);
    setShowAdd(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.areaManager.trim()) return;

    if (editingId) {
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === editingId
            ? { ...a, city: form.city, region: form.region, areaManager: form.areaManager.trim(), phone: form.phone.trim() || a.phone }
            : a,
        ),
      );
    } else {
      const nextNumber = assignments.length + 1;
      const newAssignment: AreaAssignment = {
        id: `AA-${String(nextNumber).padStart(2, "0")}`,
        city: form.city,
        region: form.region,
        areaManager: form.areaManager.trim(),
        phone: form.phone.trim() || "—",
      };
      setAssignments((prev) => [...prev, newAssignment]);
    }

    setShowAdd(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assigned Pumps Overview"
        description="Pumps under your coverage, grouped by city and region."
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            <PlusIcon className="size-3.5" />
            Add Assignment
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Assigned pumps" value={String(PUMPS.length)} icon={GaugeIcon} hint={`${citySummary.length} cities`} />
        <StatCard label="Cities covered" value={String(citySummary.length)} icon={MapPinIcon} hint={`${REGIONS.length} regions`} />
        <StatCard label="Online pumps" value={String(PUMPS.filter((p) => p.status === "Online").length)} trend="up" delta="Operating normally" />
        <StatCard label="Need attention" value={String(needAttention)} trend="down" delta="Offline or maintenance" />
      </div>

      <SectionCard title="Pumps by city" description="Status mix and monthly sales per city">
        <div className="space-y-4 p-5">
          {citySummary.map((c) => (
            <div key={c.city}>
              <div className="mb-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {c.city} <span className="text-slate-400 dark:text-slate-500">· {CITY_REGIONS[c.city] ?? "—"}</span>
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  {c.pumpCount} pumps · {formatCurrency(c.monthlySales)} this month
                </span>
              </div>
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-full bg-emerald-500" style={{ width: `${(c.online / maxPumpCount) * 100}%` }} title={`${c.online} online`} />
                <div className="h-full bg-amber-500" style={{ width: `${(c.maintenance / maxPumpCount) * 100}%` }} title={`${c.maintenance} maintenance`} />
                <div className="h-full bg-rose-500" style={{ width: `${(c.offline / maxPumpCount) * 100}%` }} title={`${c.offline} offline`} />
              </div>
            </div>
          ))}
          <div className="flex items-center gap-5 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-500" />Online</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber-500" />Maintenance</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-rose-500" />Offline</span>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Area manager assignments" description="Who covers which city/region">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">City</th>
                <th className="px-5 py-3 font-medium">Region</th>
                <th className="px-5 py-3 font-medium">Area manager</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {assignments.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{a.city}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{a.region}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{a.areaManager}</td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{a.phone}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(a)}
                      aria-label={`Edit assignment for ${a.city}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <EditIcon className="size-3.5" />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title="Pump directory"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("assigned-pumps", filteredPumps.map((p) => ({
                Pump: `Pump ${p.number}`, Name: p.name, Owner: p.owner, City: p.city,
                Region: CITY_REGIONS[p.city] ?? "—", Status: p.status, "Monthly Sales (Rs.)": p.monthlySales,
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={pumpSearch} onChange={setPumpSearch} placeholder="Search pump, owner or city…" />
          <FilterSelect value={cityFilter} onChange={setCityFilter} options={CITY_FILTERS} label="City" />
          <FilterSelect value={statusFilter} onChange={setStatusFilter} options={STATUS_FILTERS} label="Status" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Pump</th>
                <th className="px-5 py-3 font-medium">Owner</th>
                <th className="px-5 py-3 font-medium">City / Region</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Monthly sales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredPumps.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3">
                    <p className="flex items-center gap-2 font-medium text-slate-900 dark:text-white">
                      <TankIcon className="size-4 text-slate-400" />
                      Pump {p.number}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{p.name}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{p.owner}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{p.city} · {CITY_REGIONS[p.city] ?? "—"}</td>
                  <td className="px-5 py-3">
                    <Badge>{p.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatCurrency(p.monthlySales)}</td>
                </tr>
              ))}
              {filteredPumps.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No pumps match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {filteredPumps.length} of {PUMPS.length} pumps
        </p>
      </SectionCard>

      {showAdd && (
        <Modal title={editingId ? "Edit Assignment" : "Add Assignment"} onClose={() => setShowAdd(false)}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">City</label>
                <select
                  value={form.city}
                  onChange={(e) => {
                    const city = e.target.value;
                    setForm((f) => ({ ...f, city, region: CITY_REGIONS[city] ?? f.region }));
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Region</label>
                <input
                  required
                  value={form.region}
                  onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Area manager</label>
              <input
                required
                value={form.areaManager}
                onChange={(e) => setForm((f) => ({ ...f, areaManager: e.target.value }))}
                placeholder="e.g. Tariq Naveed"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+92 3xx xxx xxxx"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              {editingId ? "Save Changes" : "Add Assignment"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
