// @ts-nocheck
"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { FilterBar, SearchInput } from "@/components/dashboard/filter-controls";
import { Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { ClipboardIcon, PlusIcon } from "@/components/icons";
import { assignedPumps, pumpLabel, type RepairStatus } from "@/lib/dashboard/data/maintenance";
import { useMaintenance } from "@/lib/store/use-maintenance";

const STATUSES: RepairStatus[] = ["Pending", "In Progress", "Completed", "Cancelled"];

type RepairFormState = {
  pumpId: string;
  dispenserId: string;
  title: string;
  notes: string;
};

export default function MaintenanceRepairsPage() {
  const pumps = assignedPumps();
  const { dispensers, repairs, createRepair, updateRepairStatus } = useMaintenance();

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<RepairFormState>(() => emptyForm(pumps[0]?.id ?? ""));

  const activeRepairs = useMemo(
    () =>
      repairs
        .filter((r) => r.status === "Pending" || r.status === "In Progress")
        .filter((r) => r.title.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase())),
    [repairs, search],
  );

  const pending = repairs.filter((r) => r.status === "Pending").length;
  const inProgress = repairs.filter((r) => r.status === "In Progress").length;
  const completed = repairs.filter((r) => r.status === "Completed").length;

  function emptyForm(pumpId: string): RepairFormState {
    return { pumpId, dispenserId: "", title: "", notes: "" };
  }

  function openAdd() {
    setForm(emptyForm(pumps[0]?.id ?? ""));
    setShowForm(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.title.trim() || !form.pumpId) return;
    createRepair({ pumpId: form.pumpId, dispenserId: form.dispenserId || null, title: form.title, notes: form.notes });
    setShowForm(false);
  }

  const dispensersForForm = dispensers.filter((d) => d.pumpId === form.pumpId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Repair Tracking"
        description="Active repairs on your assigned pumps. Update status as work progresses."
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            <PlusIcon className="size-3.5" />
            New Repair
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Pending" value={String(pending)} icon={ClipboardIcon} />
        <StatCard label="In progress" value={String(inProgress)} trend={inProgress > 0 ? "down" : "up"} delta={inProgress > 0 ? "In the shop" : "None"} />
        <StatCard label="Completed" value={String(completed)} trend="up" delta="All time" />
      </div>

      <SectionCard title="Active repairs">
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search title or repair ID…" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Repair</th>
                <th className="px-5 py-3 font-medium">Pump / Dispenser</th>
                <th className="px-5 py-3 font-medium">Notes</th>
                <th className="px-5 py-3 font-medium">Started</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {activeRepairs.map((repair) => (
                <tr key={repair.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">{repair.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {repair.id}
                      {repair.issueId && ` · from ${repair.issueId}`}
                    </p>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {pumpLabel(repair.pumpId)}
                    {repair.dispenserId && (
                      <span className="block text-xs text-slate-400">{dispensers.find((d) => d.id === repair.dispenserId)?.label}</span>
                    )}
                  </td>
                  <td className="px-5 py-3 max-w-xs truncate text-slate-600 dark:text-slate-300">{repair.notes || "—"}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{repair.startedOn}</td>
                  <td className="px-5 py-3">
                    <select
                      value={repair.status}
                      onChange={(e) => updateRepairStatus(repair.id, e.target.value as RepairStatus)}
                      aria-label={`Update status for ${repair.title}`}
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {activeRepairs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No active repairs. Completed and cancelled repairs move to Repair History.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {showForm && (
        <Modal title="New Repair" subtitle="Start tracking a repair not tied to a reported issue" onClose={() => setShowForm(false)}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Pump</label>
              <select
                value={form.pumpId}
                onChange={(e) => setForm((f) => ({ ...f, pumpId: e.target.value, dispenserId: "" }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {pumps.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Pump {p.number})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Dispenser (optional)</label>
              <select
                value={form.dispenserId}
                onChange={(e) => setForm((f) => ({ ...f, dispenserId: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="">General / whole pump</option>
                {dispensersForForm.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label} ({d.fuelType})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Title</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Replace worn nozzle seal"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
                placeholder="Parts needed, progress so far, etc."
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              Start Repair
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
