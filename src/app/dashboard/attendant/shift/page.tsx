import Link from "next/link";
import { requireEmployeeSession } from "@/lib/employee/session";
import { getTodayAttendance } from "@/lib/db/attendance-service";
import { getReadingsByAttendance } from "@/lib/db/meter-reading-service";

function formatTime(date: Date | string | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default async function MyShiftPage() {
  const session = await requireEmployeeSession();
  const attendance = await getTodayAttendance(session.employeeId);
  const readings = attendance?._id ? await getReadingsByAttendance(attendance._id.toString()) : [];
  const startReading = readings.find((r) => r.type === "start");
  const endReading = readings.find((r) => r.type === "end");

  const dispensed =
    startReading && endReading && startReading.fuelType === endReading.fuelType
      ? endReading.reading - startReading.reading
      : null;

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-slate-50 px-4 py-16 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
            My Shift
          </p>
          <h1 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
            {session.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>

          <div className="mt-6 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Logged in</span>
              <span className="font-medium text-slate-900 dark:text-white">{formatTime(attendance?.loginAt)}</span>
            </div>
            {startReading && (
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Start reading ({startReading.fuelType})</span>
                <span className="font-medium text-slate-900 dark:text-white">{startReading.reading.toLocaleString()}</span>
              </div>
            )}
            {endReading ? (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">End reading ({endReading.fuelType})</span>
                  <span className="font-medium text-slate-900 dark:text-white">{endReading.reading.toLocaleString()}</span>
                </div>
                {dispensed !== null && (
                  <div className="flex justify-between border-t border-slate-200 pt-3 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400">Dispensed this shift</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">{dispensed.toLocaleString()} L</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Logged out</span>
                  <span className="font-medium text-slate-900 dark:text-white">{formatTime(attendance?.logoutAt)}</span>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Shift in progress — submit an end-of-shift reading when you're done.
              </p>
            )}
          </div>

          {!endReading && (
            <Link
              href="/dashboard/attendant/shift/end"
              className="mt-6 block w-full rounded-lg bg-slate-900 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              End Shift &amp; Log Out
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
