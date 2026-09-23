import { requireEmployeeSession } from "@/lib/employee/session";
import { MeterReadingForm } from "../meter-reading-form";

export default async function EndShiftPage() {
  const session = await requireEmployeeSession();

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-slate-50 px-4 py-16 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
            End of Duty
          </p>
          <h1 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
            End Shift, {session.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Record the closing meter reading and a photo before you log out.
          </p>

          <div className="mt-6">
            <MeterReadingForm type="end" redirectOnSuccess="/employee/logout" />
          </div>
        </div>
      </div>
    </div>
  );
}
