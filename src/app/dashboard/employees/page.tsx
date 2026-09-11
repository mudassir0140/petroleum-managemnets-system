"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { DetailRow, Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { UsersIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import { formatCurrency } from "@/lib/dashboard/format";
import { EMPLOYEES, WEEK_DAYS, totalMonthlyPayroll, type Employee } from "@/lib/dashboard/data/employees";

const PUMPS = Array.from(new Set(EMPLOYEES.map((e) => e.assignedPump)));
const STATUSES = ["Active", "On Leave", "Suspended"];

const MARK_CLASSES = {
  P: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  A: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  L: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [pump, setPump] = useState("All");
  const [status, setStatus] = useState("All");
  const [selected, setSelected] = useState<Employee | null>(null);

  const filtered = useMemo(() => {
    return EMPLOYEES.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(search.toLowerCase()) ||
        emp.title.toLowerCase().includes(search.toLowerCase());
      const matchesPump = pump === "All" || emp.assignedPump === pump;
      const matchesStatus = status === "All" || emp.status === status;
      return matchesSearch && matchesPump && matchesStatus;
    });
  }, [search, pump, status]);

  const activeCount = EMPLOYEES.filter((e) => e.status === "Active").length;
  const presentToday = EMPLOYEES.filter((e) => e.week[e.week.length - 1] === "P").length;
  const avgAttendance = Math.round(
    EMPLOYEES.reduce((sum, e) => sum + e.attendanceRate, 0) / EMPLOYEES.length,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees & Attendance"
        description="Staff directory, pump assignment, shifts, weekly offs and payroll."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total employees" value={String(EMPLOYEES.length)} icon={UsersIcon} />
        <StatCard label="Present today" value={`${presentToday} / ${EMPLOYEES.length}`} trend="up" delta="Live attendance" />
        <StatCard label="Avg. attendance rate" value={`${avgAttendance}%`} trend="up" delta="+1.4 pts" hint="last 30 days" />
        <StatCard label="Total monthly payroll" value={formatCurrency(totalMonthlyPayroll())} hint={`${activeCount} active staff`} />
      </div>

      <SectionCard
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("employees", filtered.map((e) => ({
                ID: e.id,
                Name: e.name,
                Title: e.title,
                Department: e.department,
                "Assigned Pump": e.assignedPump,
                Shift: e.shift,
                "Weekly Off": e.weeklyOff,
                Status: e.status,
                "Salary (Rs.)": e.salary,
                "Attendance Rate %": e.attendanceRate,
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search name or title…" />
          <FilterSelect value={pump} onChange={setPump} options={PUMPS} label="Assigned pump" />
          <FilterSelect value={status} onChange={setStatus} options={STATUSES} label="Status" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Employee</th>
                <th className="px-5 py-3 font-medium">Assigned pump</th>
                <th className="px-5 py-3 font-medium">Shift</th>
                <th className="px-5 py-3 font-medium">Weekly off</th>
                <th className="px-5 py-3 font-medium">Status</th>
                {WEEK_DAYS.map((day) => (
                  <th key={day} className="px-2 py-3 text-center font-medium">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((emp) => (
                <tr
                  key={emp.id}
                  onClick={() => setSelected(emp)}
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">{emp.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{emp.title}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{emp.assignedPump}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{emp.shift}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{emp.weeklyOff}</td>
                  <td className="px-5 py-3">
                    <Badge>{emp.status}</Badge>
                  </td>
                  {emp.week.map((mark, idx) => (
                    <td key={idx} className="px-2 py-3 text-center">
                      <span
                        className={`inline-flex size-6 items-center justify-center rounded-md text-xs font-semibold ${MARK_CLASSES[mark]}`}
                      >
                        {mark}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No employees match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {filtered.length} of {EMPLOYEES.length} employees · P = Present, A = Absent, L = Late · click a row for details
        </p>
      </SectionCard>

      {selected && (
        <Modal title={selected.name} subtitle={`${selected.title} · ${selected.department}`} onClose={() => setSelected(null)}>
          <DetailRow label="Assigned pump" value={selected.assignedPump} />
          <DetailRow label="Shift" value={selected.shift} />
          <DetailRow label="Weekly off" value={selected.weeklyOff} />
          <DetailRow label="Phone" value={selected.phone} />
          <DetailRow label="Status" value={<Badge>{selected.status}</Badge>} />
          <DetailRow label="Monthly salary" value={formatCurrency(selected.salary)} />
          <DetailRow label="Attendance rate" value={`${selected.attendanceRate}%`} />
          <DetailRow label="Joined" value={selected.joinDate} />
          <DetailRow
            label="This week"
            value={
              <span className="flex gap-1">
                {selected.week.map((m, i) => (
                  <span key={i} className={`inline-flex size-6 items-center justify-center rounded-md text-xs font-semibold ${MARK_CLASSES[m]}`}>
                    {m}
                  </span>
                ))}
              </span>
            }
          />
        </Modal>
      )}
    </div>
  );
}
