"use client";

import { useMemo, useState } from "react";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { CheckCircleIcon, ClockIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import {
  EMPLOYEES,
  WEEK_DAYS,
  type AttendanceMark,
  type Employee,
} from "@/lib/dashboard/data/employees";

const MARK_CLASSES: Record<AttendanceMark, string> = {
  P: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  A: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  L: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

const NEXT_MARK: Record<AttendanceMark, AttendanceMark> = { P: "A", A: "L", L: "P" };

export default function AttendancePage() {
  const [employees, setEmployees] = useState<Employee[]>(EMPLOYEES);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");

  const departments = Array.from(new Set(employees.map((e) => e.department)));

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase());
      const matchesDept = department === "All" || e.department === department;
      return matchesSearch && matchesDept;
    });
  }, [employees, search, department]);

  const presentToday = employees.filter((e) => e.week[e.week.length - 1] === "P").length;
  const absentToday = employees.filter((e) => e.week[e.week.length - 1] === "A").length;
  const avgAttendance = Math.round(
    employees.reduce((sum, e) => sum + e.attendanceRate, 0) / (employees.length || 1),
  );

  function cycleMark(employeeId: string, dayIndex: number) {
    setEmployees((prev) =>
      prev.map((e) => {
        if (e.id !== employeeId) return e;
        const week = [...e.week];
        week[dayIndex] = NEXT_MARK[week[dayIndex]];
        const presentCount = week.filter((m) => m === "P").length;
        return { ...e, week, attendanceRate: Math.round((presentCount / week.length) * 100) };
      }),
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="This week's attendance — click any day to update it."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Present today" value={String(presentToday)} icon={CheckCircleIcon} trend="up" delta="On site" />
        <StatCard label="Absent today" value={String(absentToday)} trend="down" delta="Follow up" />
        <StatCard label="Avg. attendance rate" value={`${avgAttendance}%`} icon={ClockIcon} hint="last 7 days" />
        <StatCard label="Employees tracked" value={String(employees.length)} />
      </div>

      <SectionCard
        title="Weekly attendance"
        description="P = Present, A = Absent, L = Late"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("attendance", filtered.map((e) => ({
                ID: e.id,
                Name: e.name,
                Department: e.department,
                "Attendance Rate %": e.attendanceRate,
                ...Object.fromEntries(WEEK_DAYS.map((day, i) => [day, e.week[i]])),
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search employee name…" />
          <FilterSelect value={department} onChange={setDepartment} options={departments} label="Department" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Employee</th>
                <th className="px-5 py-3 font-medium">Department</th>
                <th className="px-5 py-3 font-medium">Rate</th>
                {WEEK_DAYS.map((day) => (
                  <th key={day} className="px-2 py-3 text-center font-medium">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">{e.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{e.title}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{e.department}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{e.attendanceRate}%</td>
                  {e.week.map((mark, idx) => (
                    <td key={idx} className="px-2 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => cycleMark(e.id, idx)}
                        aria-label={`Toggle ${WEEK_DAYS[idx]} attendance for ${e.name}`}
                        className={`inline-flex size-6 items-center justify-center rounded-md text-xs font-semibold transition hover:opacity-80 ${MARK_CLASSES[mark]}`}
                      >
                        {mark}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No employees match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {filtered.length} of {employees.length} employees · click a day cell to cycle P → A → L
        </p>
      </SectionCard>
    </div>
  );
}
