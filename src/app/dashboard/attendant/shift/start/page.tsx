import { requireEmployeeSession } from "@/lib/employee/session";
import { MeterReadingForm } from "../meter-reading-form";

export default async function StartShiftPage() {
  const session = await requireEmployeeSession();

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-slate-50 px-4 py-16 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
            Start of Duty
          </p>
          <h1 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
            Welcome, {session.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Before you start your shift, record the meter reading and a photo for the nozzle you're assigned to.
          </p>

          <div className="mt-6">
            <MeterReadingForm type="start" redirectOnSuccess="/dashboard/attendant/shift" />
          </div>
        </div>
      </div>
    </div>
  );
}
