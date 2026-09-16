// @ts-nocheck
import { Badge } from "@/components/dashboard/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { WEEK_DAYS } from "@/lib/dashboard/data/employees";
import { ownerStaff } from "@/lib/dashboard/data/pump-owner-portal";
import { formatCurrency } from "@/lib/dashboard/format";

export default function PumpOwnerStaffPage() {
  const staff = ownerStaff();
  const present = staff.filter((s) => s.status === "Active").length;
  const onLeave = staff.filter((s) => s.status !== "Active").length;

  return (
    <div className="space-y-6">
      <PageHeader title="My Staff" description="Roster and attendance for staff at your pump." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total employees" value={String(staff.length)} />
        <StatCard label="Present today" value={String(present)} trend="up" />
        <StatCard label="Absent / on leave" value={String(onLeave)} trend={onLeave > 0 ? "down" : undefined} />
      </div>

      <SectionCard title="Staff directory">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Employee</th>
                <th className="px-5 py-3 font-medium">Shift</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Salary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {staff.map((employee) => (
                <tr key={employee.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">{employee.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{employee.title}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{employee.shift}</td>
                  <td className="px-5 py-3">
                    <Badge>{employee.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {formatCurrency(employee.salary)}
                  </td>
                </tr>
              ))}
              {staff.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No staff assigned to this pump.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Attendance this week">
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
                      <Badge tone={mark === "P" ? "success" : mark === "L" ? "warning" : "danger"}>{mark}</Badge>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
