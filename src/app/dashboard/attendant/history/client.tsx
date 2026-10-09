"use client";

import { useEffect, useState } from "react";
import { BackButton } from "@/components/dashboard/BackButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import type { EmployeeSession } from "@/lib/employee/session";

interface ShiftRecord {
  id: string;
  date: string;
  startTime: string;
  endTime: string | null;
  startReading: number | null;
  endReading: number | null;
  litresSold: number;
  hoursWorked: number;
  fuelType: string;
  hasStartPhoto: boolean;
  hasEndPhoto: boolean;
  status: "Active" | "Closed";
}

export function AttendantHistoryClient({ session }: { session: EmployeeSession }) {
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchShifts() {
      try {
        const response = await fetch("/api/employee/shifts?limit=100", {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch shifts");

        const result = await response.json();
        setShifts(result.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchShifts();
  }, []);

  const closedShifts = shifts.filter((s) => s.status === "Closed");
  const totalLitres = shifts.reduce((sum, s) => sum + s.litresSold, 0);
  const totalHours = shifts.reduce((sum, s) => sum + s.hoursWorked, 0);

  return (
    <div className="space-y-6">
      <BackButton href="/dashboard/attendant" />
      <PageHeader
        title="Shift History / شفٹ کی تاریخ"
        description="Your past shifts with readings and time worked"
      />

      <Card>
        <CardHeader title="Summary" />
        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
          <div className="rounded-lg bg-surface-3 p-4">
            <label className="text-xs font-medium text-ink-muted uppercase">Shifts Completed</label>
            <p className="mt-2 text-2xl font-bold text-ink-primary">{closedShifts.length}</p>
          </div>
          <div className="rounded-lg bg-surface-3 p-4">
            <label className="text-xs font-medium text-ink-muted uppercase">Total Litres</label>
            <p className="mt-2 text-2xl font-bold text-brand-500">{totalLitres.toFixed(2)} L</p>
          </div>
          <div className="rounded-lg bg-surface-3 p-4">
            <label className="text-xs font-medium text-ink-muted uppercase">Total Hours</label>
            <p className="mt-2 text-2xl font-bold text-ink-primary">{totalHours.toFixed(1)}h</p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Shift History" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="px-4 py-3 text-left font-medium text-ink-muted">Date</th>
                <th className="px-4 py-3 text-left font-medium text-ink-muted">Time</th>
                <th className="px-4 py-3 text-left font-medium text-ink-muted">Fuel</th>
                <th className="px-4 py-3 text-right font-medium text-ink-muted">Start Reading</th>
                <th className="px-4 py-3 text-right font-medium text-ink-muted">End Reading</th>
                <th className="px-4 py-3 text-right font-medium text-ink-muted">Litres</th>
                <th className="px-4 py-3 text-center font-medium text-ink-muted">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-ink-muted">
                    Loading...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-rose-600">
                    {error}
                  </td>
                </tr>
              ) : shifts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-ink-muted">
                    No shifts recorded yet
                  </td>
                </tr>
              ) : (
                shifts.map((shift) => (
                  <tr key={shift.id} className="border-b border-border-subtle hover:bg-surface-2">
                    <td className="px-4 py-3 text-ink-primary font-medium">{shift.date}</td>
                    <td className="px-4 py-3 text-ink-primary">
                      {new Date(shift.startTime).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {shift.endTime && ` - ${new Date(shift.endTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`}
                    </td>
                    <td className="px-4 py-3 text-ink-primary capitalize">{shift.fuelType}</td>
                    <td className="px-4 py-3 text-right text-ink-primary">{shift.startReading?.toFixed(1)}</td>
                    <td className="px-4 py-3 text-right text-ink-primary">{shift.endReading?.toFixed(1) || "-"}</td>
                    <td className="px-4 py-3 text-right font-medium text-brand-500">{shift.litresSold.toFixed(2)} L</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          shift.status === "Active"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        }`}
                      >
                        {shift.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
