"use client";

import { useMemo, useState } from "react";
import { PhoneIcon, UsersIcon } from "@/components/icons";
import { AttendanceBadge, LeaveStatusBadge } from "@/components/ops/badge";
import { FilterBar } from "@/components/ops/filter-controls";
import { PageHeader } from "@/components/ops/page-header";
import { SectionCard } from "@/components/ops/section-card";
import { StatCard } from "@/components/ops/stat-card";
import { useAttendance, useLeaveRequests } from "@/lib/store/use-workforce";
import type { AttendanceStatus, ShiftName } from "@/lib/types";

const SHIFTS: ShiftName[] = ["Morning", "Evening", "Night"];

const SHIFT_FILTER_OPTIONS = [
  { value: "all", label: "All shifts" },
  ...SHIFTS.map((shift) => ({ value: shift, label: `${shift} shift` })),
];

const ATTENDANCE_FILTER_OPTIONS = [
  { value: "all", label: "All attendance" },
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "on-leave", label: "On Leave" },
];

export default function EmployeeManagementPage() {
  const { setStatus, setShift, employeesWithAttendance } = useAttendance();
  const { requests, updateStatus } = useLeaveRequests();
  const [search, setSearch] = useState("");
  const [shiftFilter, setShiftFilter] = useState("all");
  const [attendanceFilter, setAttendanceFilter] = useState("all");

  const employees = employeesWithAttendance();

  const filtered = useMemo(() => {
    return employees.filter((employee) => {
      const matchesSearch =
        !search ||
        employee.name.toLowerCase().includes(search.toLowerCase()) ||
        employee.role.toLowerCase().includes(search.toLowerCase());
      const matchesShift = shiftFilter === "all" || employee.shift === shiftFilter;
      const matchesAttendance =
        attendanceFilter === "all" || employee.attendance === attendanceFilter;
      return matchesSearch && matchesShift && matchesAttendance;
    });
  }, [employees, search, shiftFilter, attendanceFilter]);

  const present = employees.filter((e) => e.attendance === "present").length;
  const absent = employees.filter((e) => e.attendance === "absent").length;
  const onLeave = employees.filter((e) => e.attendance === "on-leave").length;
  const pendingLeave = requests.filter((r) => r.status === "pending");

  function cycleAttendance(current: AttendanceStatus): AttendanceStatus {
    if (current === "present") return "absent";
    if (current === "absent") return "on-leave";
    return "present";
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Management"
        description="Assign shifts, track attendance and manage leave requests across the network."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total staff" value={String(employees.length)} icon={UsersIcon} tone="amber" />
        <StatCard label="Present today" value={String(present)} icon={UsersIcon} tone="emerald" />
        <StatCard label="Absent today" value={String(absent)} icon={UsersIcon} tone="rose" />
        <StatCard label="On leave" value={String(onLeave)} icon={UsersIcon} tone="purple" />
      </div>

      <SectionCard
        title="All employees"
        description="Click the attendance badge to cycle present / absent / on leave"
        noPadding
      >
        <div className="border-b border-slate-100 p-5 dark:border-slate-800">
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by name or role..."
            filters={[
              {
                key: "shift",
                label: "Filter by shift",
                value: shiftFilter,
                options: SHIFT_FILTER_OPTIONS,
                onChange: setShiftFilter,
              },
              {
                key: "attendance",
                label: "Filter by attendance",
                value: attendanceFilter,
                options: ATTENDANCE_FILTER_OPTIONS,
                onChange: setAttendanceFilter,
              },
            ]}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Employee</th>
                <th className="px-5 py-3 font-medium">Assigned pump</th>
                <th className="px-5 py-3 font-medium">Current shift</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Attendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((employee) => (
                <tr key={employee.id}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${employee.avatarColor}`}
                      >
                        {employee.name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")}
                      </span>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {employee.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {employee.role}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {employee.pumpName ?? "Depot / Fleet"}
                  </td>
                  <td className="px-5 py-3">
                    <select
                      value={employee.shift}
                      onChange={(e) => setShift(employee.id, e.target.value as ShiftName)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      {SHIFTS.map((shift) => (
                        <option key={shift} value={shift}>
                          {shift}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <a
                      href={`tel:${employee.phone.replace(/\s+/g, "")}`}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400"
                    >
                      <PhoneIcon className="size-3.5" />
                      {employee.phone}
                    </a>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => setStatus(employee.id, cycleAttendance(employee.attendance))}
                      title="Click to update attendance"
                    >
                      <AttendanceBadge status={employee.attendance} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    No employees match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title="Leave requests"
        description={`${pendingLeave.length} awaiting your approval`}
        noPadding
      >
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {requests.map((request) => (
            <li key={request.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {request.employeeName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {request.fromDate === request.toDate
                    ? request.fromDate
                    : `${request.fromDate} – ${request.toDate}`}{" "}
                  · {request.reason}
                </p>
                <p className="text-xs text-slate-400">Requested on {request.requestedOn}</p>
              </div>
              <div className="flex items-center gap-2">
                <LeaveStatusBadge status={request.status} />
                {request.status === "pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() => updateStatus(request.id, "approved")}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatus(request.id, "rejected")}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}
