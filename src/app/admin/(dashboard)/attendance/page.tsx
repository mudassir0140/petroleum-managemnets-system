import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { getAttendanceByDate } from "@/lib/db/attendance-service";
import { getReadingsByAttendance } from "@/lib/db/meter-reading-service";
import { getAllEmployees } from "@/lib/db/employee-service";
import { getRoleBySlug } from "@/lib/roles";

function formatTime(date: Date | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default async function AttendancePage() {
  const [records, employees] = await Promise.all([getAttendanceByDate(), getAllEmployees()]);
  const employeeById = new Map(employees.map((e) => [e._id!.toString(), e]));

  const rows = await Promise.all(
    records.map(async (r) => {
      const employee = employeeById.get(r.employeeId.toString());
      const readings = r._id ? await getReadingsByAttendance(r._id.toString()) : [];
      const start = readings.find((x) => x.type === "start");
      const end = readings.find((x) => x.type === "end");
      const dispensed =
        start && end && start.fuelType === end.fuelType ? end.reading - start.reading : null;

      return {
        id: r._id!.toString(),
        employeeName: employee?.name ?? "Unknown",
        role: employee ? getRoleBySlug(employee.role).label : "—",
        loginAt: r.loginAt,
        logoutAt: r.logoutAt,
        start,
        end,
        dispensed,
      };
    })
  );

  const present = rows.length;
  const stillOnDuty = rows.filter((r) => !r.logoutAt).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Auto-marked on login — today's log-ins, log-outs, and pump-attendant meter readings."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Present today" value={String(present)} tone="emerald" />
        <StatCard label="Still on duty" value={String(stillOnDuty)} tone="amber" />
        <StatCard label="Logged out" value={String(present - stillOnDuty)} tone="sky" />
      </div>

      <SectionCard title="Today's Attendance">
        <div className="overflow-x-auto">
          {rows.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-slate-600 dark:text-slate-400">
              No one has logged in today yet
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                  <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Employee</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Role</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Login</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Logout</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Meter Readings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-6 py-3 font-medium text-slate-900 dark:text-white">{r.employeeName}</td>
                    <td className="px-6 py-3 text-slate-600 dark:text-slate-400">{r.role}</td>
                    <td className="px-6 py-3 text-slate-600 dark:text-slate-400">{formatTime(r.loginAt)}</td>
                    <td className="px-6 py-3 text-slate-600 dark:text-slate-400">
                      {r.logoutAt ? (
                        formatTime(r.logoutAt)
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                          On duty
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {r.start ? (
                        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900 dark:text-white">Start:</span>
                            <span>{r.start.reading.toLocaleString()} ({r.start.fuelType})</span>
                            {r.start.photoDataUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={r.start.photoDataUrl} alt="Start meter" className="h-8 w-8 rounded border border-slate-200 object-cover dark:border-slate-700" />
                            )}
                          </div>
                          {r.end ? (
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-900 dark:text-white">End:</span>
                              <span>{r.end.reading.toLocaleString()} ({r.end.fuelType})</span>
                              {r.end.photoDataUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={r.end.photoDataUrl} alt="End meter" className="h-8 w-8 rounded border border-slate-200 object-cover dark:border-slate-700" />
                              )}
                            </div>
                          ) : (
                            <p className="text-slate-400 dark:text-slate-600">Shift in progress</p>
                          )}
                          {r.dispensed !== null && (
                            <p className="font-semibold text-amber-600 dark:text-amber-400">
                              {r.dispensed.toLocaleString()} L dispensed
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
