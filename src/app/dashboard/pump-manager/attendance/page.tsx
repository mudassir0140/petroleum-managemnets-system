// @ts-nocheck
"use client";

import { useMemo, useState } from "react";
import { FilterBar, SearchInput } from "@/components/dashboard/filter-controls";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { ClockIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import { managerStaff } from "@/lib/dashboard/data/pump-manager-portal";
import { WEEK_DAYS, type AttendanceMark, type Employee } from "@/lib/dashboard/data/employees";

const MARK_CLASSES: Record<AttendanceMark, string> = {
  P: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  A: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  L: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
};
const MARK_LABEL: Record<AttendanceMark, string> = { P: "Present", A: "Absent", L: "Leave" };
const NEXT_MARK: Record<AttendanceMark, AttendanceMark> = { P: "A", A: "L", L: "P" };

export default function PumpManagerAttendancePage() {
  const [staff, setStaff] = useState<Employee[]>(managerStaff());
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => staff.filter((e) => e.name.toLowerCase().includes(search.toLowerCase())),
    [staff, search],
  );

  const presentToday = staff.filter((e) => e.week[e.week.length - 1] === "P").length;
  const absentToday = staff.filter((e) => e.week[e.week.length - 1] === "A").length;
  const onLeaveToday = staff.filter((e) => e.week[e.week.length - 1] === "L").length;

  function cycleToday(employeeId: string) {
    setStaff((prev) =>
      prev.map((e) => {
        if (e.id !== employeeId) return e;
        const week = [...e.week];
        const lastIndex = week.length - 1;
        week[lastIndex] = NEXT_MARK[week[lastIndex]];
        return { ...e, week };
      }),
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" description="Mark and review today's attendance for staff at your assigned pump." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Present today" value={String(presentToday)} icon={ClockIcon} trend="up" delta="On duty" />
        <StatCard label="Absent today" value={String(absentToday)} trend={absentToday > 0 ? "down" : undefined} />
        <StatCard label="On leave today" value={String(onLeaveToday)} />
      </div>

      <SectionCard title="Today's attendance" description="Click a status pill to cycle Present → Absent → Leave">
        <div className="p-5">
          <FilterBar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search staff…" />
          </FilterBar>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((e) => {
              const today = e.week[e.week.length - 1];
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => cycleToday(e.id)}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3.5 text-left transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{e.name}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{e.title} · {e.shift}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${MARK_CLASSES[today]}`}>
                    {MARK_LABEL[today]}
                  </span>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="col-span-full py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                No staff match this search.
              </p>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Attendance this week"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv(
                "pump-manager-attendance",
                staff.map((e) => ({
                  Employee: e.name,
                  ...Object.fromEntries(WEEK_DAYS.map((day, i) => [day, MARK_LABEL[e.week[i]]])),
                })),
              )
            }
          />
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Employee</th>
                {WEEK_DAYS.map((day) => (
                  <th key={day} className="px-3 py-3 text-center font-medium">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {staff.map((employee) => (
                <tr key={employee.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{employee.name}</td>
                  {employee.week.map((mark, index) => (
                    <td key={index} className="px-3 py-3 text-center">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${MARK_CLASSES[mark]}`}>
                        {mark}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
              {staff.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No staff assigned to this pump.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
