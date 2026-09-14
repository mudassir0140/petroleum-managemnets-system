import { Badge } from "@/components/dashboard/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { managerStaff } from "@/lib/dashboard/data/pump-manager-portal";
import { formatCurrency } from "@/lib/dashboard/format";

const SHIFTS = ["Morning", "Afternoon", "Night"] as const;

export default function PumpManagerStaffPage() {
  const staff = managerStaff();
  const present = staff.filter((s) => s.status === "Active").length;
  const onLeave = staff.filter((s) => s.status !== "Active").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Staff & Shifts" description="Roster and shift coverage for staff at your assigned pump." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total employees" value={String(staff.length)} />
        <StatCard label="Active" value={String(present)} trend="up" />
        <StatCard label="On leave / suspended" value={String(onLeave)} trend={onLeave > 0 ? "down" : undefined} />
      </div>

      <SectionCard title="Shift coverage" description="Staff assigned per shift at this pump">
        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-3">
          {SHIFTS.map((shift) => {
            const onShift = staff.filter((s) => s.shift === shift);
            return (
              <div key={shift} className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{shift}</p>
                <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{onShift.length}</p>
                <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                  {onShift.length > 0 ? onShift.map((s) => s.name).join(", ") : "No one assigned"}
                </p>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Staff directory">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Employee</th>
                <th className="px-5 py-3 font-medium">Shift</th>
                <th className="px-5 py-3 font-medium">Weekly off</th>
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
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{employee.weeklyOff}</td>
                  <td className="px-5 py-3">
                    <Badge>{employee.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatCurrency(employee.salary)}</td>
                </tr>
              ))}
              {staff.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
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
