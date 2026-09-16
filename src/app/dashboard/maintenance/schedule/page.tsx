// @ts-nocheck
"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { FilterBar, SearchInput } from "@/components/dashboard/filter-controls";
import { Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { CalendarIcon, PlusIcon } from "@/components/icons";
import { assignedPumps, pumpLabel, type ScheduledTaskStatus } from "@/lib/dashboard/data/maintenance";
import { useMaintenance } from "@/lib/store/use-maintenance";

const STATUSES: ScheduledTaskStatus[] = ["Scheduled", "In Progress", "Completed", "Missed"];

type TaskFormState = {
  pumpId: string;
  dispenserId: string;
  title: string;
  notes: string;
  scheduledDate: string;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function MaintenanceSchedulePage() {
  const pumps = assignedPumps();
  const { dispensers, tasks, scheduleTask, updateTaskStatus } = useMaintenance();
  const today = todayIso();

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<TaskFormState>(() => emptyForm(pumps[0]?.id ?? ""));

  const sorted = useMemo(
    () =>
      tasks
        .filter((t) => t.title.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase()))
        .slice()
        .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)),
    [tasks, search],
  );

  const scheduledCount = tasks.filter((t) => t.status === "Scheduled").length;
  const overdueCount = tasks.filter((t) => t.status === "Scheduled" && t.scheduledDate < today).length;
  const completedCount = tasks.filter((t) => t.status === "Completed").length;

  function emptyForm(pumpId: string): TaskFormState {
    return { pumpId, dispenserId: "", title: "", notes: "", scheduledDate: today };
  }

  function openAdd() {
    setForm(emptyForm(pumps[0]?.id ?? ""));
    setShowForm(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.title.trim() || !form.pumpId || !form.scheduledDate) return;
    scheduleTask({
      pumpId: form.pumpId,
      dispenserId: form.dispenserId || null,
      title: form.title,
      notes: form.notes,
      scheduledDate: form.scheduledDate,
    });
    setShowForm(false);
  }

  const dispensersForForm = dispensers.filter((d) => d.pumpId === form.pumpId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schedule Maintenance"
        description="Plan upcoming servicing and preventive maintenance for your assigned pumps."
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            <PlusIcon className="size-3.5" />
            Schedule Task
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Scheduled" value={String(scheduledCount)} icon={CalendarIcon} />
        <StatCard label="Overdue" value={String(overdueCount)} trend={overdueCount > 0 ? "down" : "up"} delta={overdueCount > 0 ? "Past due date" : "None"} />
        <StatCard label="Completed" value={String(completedCount)} trend="up" delta="All time" />
      </div>

      <SectionCard title="Scheduled tasks">
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search title or task ID…" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Task</th>
                <th className="px-5 py-3 font-medium">Pump / Dispenser</th>
                <th className="px-5 py-3 font-medium">Scheduled date</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {sorted.map((task) => {
                const overdue = task.status === "Scheduled" && task.scheduledDate < today;
                return (
                  <tr key={task.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">{task.title}</p>
                      <p className="max-w-xs truncate text-xs text-slate-500 dark:text-slate-400">{task.notes || task.id}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {pumpLabel(task.pumpId)}
                      {task.dispenserId && (
                        <span className="block text-xs text-slate-400">{dispensers.find((d) => d.id === task.dispenserId)?.label}</span>
                      )}
                    </td>
                    <td className={`px-5 py-3 ${overdue ? "font-medium text-rose-600 dark:text-rose-400" : "text-slate-600 dark:text-slate-300"}`}>
                      {task.scheduledDate}
                      {overdue && " · Overdue"}
                    </td>
                    <td className="px-5 py-3">
                      <select
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value as ScheduledTaskStatus)}
                        aria-label={`Update status for ${task.title}`}
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
                );
              })}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No scheduled tasks match this search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {showForm && (
        <Modal title="Schedule Maintenance Task" onClose={() => setShowForm(false)}>
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
                placeholder="e.g. Quarterly calibration check"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Scheduled date</label>
              <input
                required
                type="date"
                value={form.scheduledDate}
                onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
                placeholder="Parts or tools to bring, checks to perform, etc."
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              Schedule Task
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
