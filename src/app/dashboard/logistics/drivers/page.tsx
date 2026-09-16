// @ts-nocheck
"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { EditIcon, PlusIcon, UsersIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import { DRIVERS, type Driver, type DriverStatus } from "@/lib/dashboard/data/drivers";
import { TANKERS } from "@/lib/dashboard/data/tankers";

const STATUSES: DriverStatus[] = ["On Duty", "Off Duty", "On Leave", "Suspended"];

type DriverFormState = {
  name: string;
  license: string;
  phone: string;
  experienceYears: string;
  assignedTanker: string;
  status: DriverStatus;
  rating: string;
};

function emptyForm(): DriverFormState {
  return { name: "", license: "", phone: "", experienceYears: "", assignedTanker: "—", status: "On Duty", rating: "4.5" };
}

function formFromDriver(driver: Driver): DriverFormState {
  return {
    name: driver.name,
    license: driver.license,
    phone: driver.phone,
    experienceYears: String(driver.experienceYears),
    assignedTanker: driver.assignedTanker,
    status: driver.status,
    rating: String(driver.rating),
  };
}

export default function LogisticsDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>(DRIVERS);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DriverFormState>(emptyForm());

  const filtered = useMemo(() => {
    return drivers.filter((d) => {
      const matchesSearch =
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.license.toLowerCase().includes(search.toLowerCase()) ||
        d.id.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === "All" || d.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [drivers, search, status]);

  const onDuty = drivers.filter((d) => d.status === "On Duty").length;
  const unavailable = drivers.filter((d) => d.status === "On Leave" || d.status === "Suspended").length;
  const avgRating = drivers.reduce((sum, d) => sum + d.rating, 0) / (drivers.length || 1);

  function openAdd() {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(driver: Driver) {
    setForm(formFromDriver(driver));
    setEditingId(driver.id);
    setShowForm(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.license.trim()) return;
    const experienceYears = Number(form.experienceYears) || 0;
    const rating = Math.min(5, Math.max(0, Number(form.rating) || 0));

    if (editingId) {
      setDrivers((prev) =>
        prev.map((d) =>
          d.id === editingId
            ? {
                ...d,
                name: form.name.trim(),
                license: form.license.trim(),
                phone: form.phone.trim() || d.phone,
                experienceYears,
                assignedTanker: form.assignedTanker,
                status: form.status,
                rating,
              }
            : d,
        ),
      );
    } else {
      const nextNumber = drivers.length + 1;
      const newDriver: Driver = {
        id: `DRV-${String(nextNumber).padStart(2, "0")}`,
        name: form.name.trim(),
        license: form.license.trim(),
        phone: form.phone.trim() || "—",
        experienceYears,
        assignedTanker: form.assignedTanker,
        status: form.status,
        rating,
        joinDate: new Date().toISOString().slice(0, 10),
      };
      setDrivers((prev) => [...prev, newDriver]);
    }

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Drivers"
        description="Driver directory — licence, experience, assigned tanker and duty status."
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            <PlusIcon className="size-3.5" />
            Add Driver
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total drivers" value={String(drivers.length)} icon={UsersIcon} />
        <StatCard label="On duty" value={String(onDuty)} trend="up" delta="Active now" />
        <StatCard label="On leave / suspended" value={String(unavailable)} trend="down" delta="Unavailable" />
        <StatCard label="Avg. rating" value={avgRating.toFixed(1)} hint="out of 5.0" />
      </div>

      <SectionCard
        title="All drivers"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("drivers", filtered.map((d) => ({
                ID: d.id,
                Name: d.name,
                Licence: d.license,
                Phone: d.phone,
                "Experience (yrs)": d.experienceYears,
                "Assigned Tanker": d.assignedTanker,
                Status: d.status,
                Rating: d.rating,
                "Join Date": d.joinDate,
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search name, licence or ID…" />
          <FilterSelect value={status} onChange={setStatus} options={STATUSES} label="Status" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Driver</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Experience</th>
                <th className="px-5 py-3 font-medium">Assigned tanker</th>
                <th className="px-5 py-3 font-medium">Rating</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">{d.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{d.license} · {d.id}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{d.phone}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{d.experienceYears} yrs</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{d.assignedTanker}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">★ {d.rating.toFixed(1)}</td>
                  <td className="px-5 py-3">
                    <Badge>{d.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(d)}
                      aria-label={`Edit ${d.name}`}
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
                    No drivers match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {filtered.length} of {drivers.length} drivers
        </p>
      </SectionCard>

      {showForm && (
        <Modal title={editingId ? "Edit Driver" : "Add Driver"} onClose={() => setShowForm(false)}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Full name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Nasir Hussain"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Licence no.</label>
                <input
                  required
                  value={form.license}
                  onChange={(e) => setForm((f) => ({ ...f, license: e.target.value }))}
                  placeholder="e.g. KHI-204581"
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
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Experience (yrs)</label>
                <input
                  type="number"
                  min={0}
                  value={form.experienceYears}
                  onChange={(e) => setForm((f) => ({ ...f, experienceYears: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Assigned tanker</label>
                <select
                  value={form.assignedTanker}
                  onChange={(e) => setForm((f) => ({ ...f, assignedTanker: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="—">Unassigned</option>
                  {TANKERS.map((t) => (
                    <option key={t.id} value={t.id}>{t.id}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as DriverStatus }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Rating (0-5)</label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  step={0.1}
                  value={form.rating}
                  onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              {editingId ? "Save Changes" : "Add Driver"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
