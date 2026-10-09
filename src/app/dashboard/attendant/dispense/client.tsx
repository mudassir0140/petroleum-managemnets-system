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

export function DispenseFuelClient({ session }: { session: EmployeeSession }) {
  const [todayShifts, setTodayShifts] = useState<ShiftRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTodayShifts() {
      try {
        const today = new Date().toISOString().split("T")[0];
        const response = await fetch(`/api/employee/shifts?startDate=${today}&endDate=${today}`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch shifts");

        const result = await response.json();
        setTodayShifts(result.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchTodayShifts();
  }, []);

  const activeShift = todayShifts.find((s) => s.status === "Active");
  const totalLitres = todayShifts.reduce((sum, s) => sum + s.litresSold, 0);

  return (
    <div className="space-y-6">
      <BackButton href="/dashboard/attendant" />
      <PageHeader
        title="Dispense Fuel / ایندھن برائے ڈسپنس"
        description="View today's shift readings and fuel dispensed"
      />

      {loading ? (
        <Card>
          <div className="p-6 text-center text-ink-muted">Loading shifts...</div>
        </Card>
      ) : error ? (
        <Card>
          <div className="p-6 text-center text-rose-600">{error}</div>
        </Card>
      ) : !activeShift ? (
        <Card>
          <CardHeader title="No Active Shift" />
          <div className="p-6 text-center text-ink-muted">
            <p>No active shift for today. Start a shift from the Overview page.</p>
          </div>
        </Card>
      ) : (
        <>
          <Card className="bg-brand-500/5 border-brand-500/20">
            <CardHeader title="Active Shift" />
            <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-4">
              <div>
                <label className="text-xs font-medium text-ink-muted uppercase">Fuel Type</label>
                <p className="mt-1 text-sm font-medium text-ink-primary capitalize">{activeShift.fuelType}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-ink-muted uppercase">Start Reading</label>
                <p className="mt-1 text-sm font-medium text-ink-primary">{activeShift.startReading?.toFixed(1)}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-ink-muted uppercase">End Reading</label>
                <p className="mt-1 text-sm font-medium text-ink-primary">{activeShift.endReading?.toFixed(1) || "-"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-ink-muted uppercase">Litres Sold</label>
                <p className="mt-1 text-sm font-bold text-brand-500">{activeShift.litresSold.toFixed(2)} L</p>
              </div>
            </div>
          </Card>
        </>
      )}

      <Card>
        <CardHeader title={`Today's Shifts (${todayShifts.length})`} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="px-4 py-3 text-left font-medium text-ink-muted">Time</th>
                <th className="px-4 py-3 text-left font-medium text-ink-muted">Fuel</th>
                <th className="px-4 py-3 text-right font-medium text-ink-muted">Start Reading</th>
                <th className="px-4 py-3 text-right font-medium text-ink-muted">End Reading</th>
                <th className="px-4 py-3 text-right font-medium text-ink-muted">Litres</th>
                <th className="px-4 py-3 text-center font-medium text-ink-muted">Status</th>
              </tr>
            </thead>
            <tbody>
              {todayShifts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-muted">
                    No shifts today
                  </td>
                </tr>
              ) : (
                todayShifts.map((shift) => (
                  <tr key={shift.id} className="border-b border-border-subtle hover:bg-surface-2">
                    <td className="px-4 py-3 text-ink-primary">
                      {new Date(shift.startTime).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
