"use client";

import { useState } from "react";
import { Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { CalendarIcon, EditIcon } from "@/components/icons";
import { EMPLOYEES, type Employee } from "@/lib/dashboard/data/employees";

const SHIFTS: Employee["shift"][] = ["Morning", "Afternoon", "Night"];
const WEEKLY_OFF_OPTIONS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const SHIFT_TONE: Record<Employee["shift"], string> = {
  Morning: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  Afternoon: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400",
  Night: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
};

export default function ShiftsPage() {
  const [employees, setEmployees] = useState<Employee[]>(EMPLOYEES);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<{ shift: Employee["shift"]; weeklyOff: string }>({
    shift: "Morning",
    weeklyOff: "Sunday",
  });

  function openEdit(employee: Employee) {
    setEditing(employee);
    setForm({ shift: employee.shift, weeklyOff: employee.weeklyOff });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setEmployees((prev) =>
      prev.map((e) => (e.id === editing.id ? { ...e, shift: form.shift, weeklyOff: form.weeklyOff } : e)),
    );
    setEditing(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shifts"
        description="Shift roster across the network — click an employee to reassign their shift."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {SHIFTS.map((shift) => (
          <StatCard
            key={shift}
            label={`${shift} shift`}
            value={String(employees.filter((e) => e.shift === shift).length)}
            icon={CalendarIcon}
            hint="employees assigned"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {SHIFTS.map((shift) => {
          const shiftEmployees = employees.filter((e) => e.shift === shift);
          return (
            <SectionCard key={shift} title={`${shift} shift`} description={`${shiftEmployees.length} employees`}>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {shiftEmployees.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{e.name}</p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {e.title} · {e.assignedPump}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openEdit(e)}
                      aria-label={`Reassign shift for ${e.name}`}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <EditIcon className="size-3.5" />
                    </button>
                  </li>
                ))}
                {shiftEmployees.length === 0 && (
                  <li className="px-5 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    No one on this shift.
                  </li>
                )}
              </ul>
            </SectionCard>
          );
        })}
      </div>

      <SectionCard title="Full roster">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Employee</th>
                <th className="px-5 py-3 font-medium">Department</th>
                <th className="px-5 py-3 font-medium">Shift</th>
                <th className="px-5 py-3 font-medium">Weekly off</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {employees.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{e.name}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{e.department}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${SHIFT_TONE[e.shift]}`}>
                      {e.shift}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{e.weeklyOff}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(e)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <EditIcon className="size-3.5" />
                      Reassign
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {editing && (
        <Modal title={`Reassign shift — ${editing.name}`} subtitle={editing.title} onClose={() => setEditing(null)}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Shift</label>
              <select
                value={form.shift}
                onChange={(e) => setForm((f) => ({ ...f, shift: e.target.value as Employee["shift"] }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {SHIFTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Weekly off day</label>
              <select
                value={form.weeklyOff}
                onChange={(e) => setForm((f) => ({ ...f, weeklyOff: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {WEEKLY_OFF_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              Save Changes
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
