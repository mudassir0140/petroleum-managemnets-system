"use client";

import { useEffect, useState } from "react";
import { BackButton } from "@/components/dashboard/BackButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";

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

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchShifts() {
      try {
        const response = await fetch("/api/employee/shifts?limit=50");
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalLitres = shifts.reduce((sum, shift) => sum + shift.litresSold, 0);
  const totalHours = shifts.reduce((sum, shift) => sum + shift.hoursWorked, 0);

  return (
    <div>
      <BackButton />
      <PageHeader
        title="Shifts & Meter Readings / شفٹیں اور میٹر ریڈنگز"
        description="Your shift records with fuel dispensed and time worked"
      />

      <Card className="mb-6">
        <CardHeader title="Shift Summary / شفٹ کا خلاصہ" />
        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
          <div className="rounded-lg bg-surface-3 p-4">
            <label className="text-xs font-medium text-ink-muted uppercase">Total Shifts / کل شفٹیں</label>
            <p className="mt-2 text-2xl font-bold text-ink-primary">{shifts.length}</p>
          </div>
          <div className="rounded-lg bg-surface-3 p-4">
            <label className="text-xs font-medium text-ink-muted uppercase">Total Litres / کل لیٹر</label>
            <p className="mt-2 text-2xl font-bold text-brand-500">{totalLitres.toFixed(2)} L</p>
          </div>
          <div className="rounded-lg bg-surface-3 p-4">
            <label className="text-xs font-medium text-ink-muted uppercase">Total Hours / کل اوقات</label>
            <p className="mt-2 text-2xl font-bold text-ink-primary">{totalHours.toFixed(2)}h</p>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {loading ? (
          <Card>
            <div className="p-6 text-center text-ink-muted">Loading...</div>
          </Card>
        ) : error ? (
          <Card>
            <div className="p-6 text-center text-rose-600">{error}</div>
          </Card>
        ) : shifts.length === 0 ? (
          <Card>
            <div className="p-6 text-center text-ink-muted">No shift records yet</div>
          </Card>
        ) : (
          shifts.map((shift) => (
            <Card key={shift.id}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-ink-primary">{shift.date}</p>
                    <p className="text-xs text-ink-muted">
                      {formatTime(shift.startTime)}
                      {shift.endTime && ` - ${formatTime(shift.endTime)}`}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    shift.status === "Closed"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  }`}>
                    {shift.status}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                  <div>
                    <label className="text-xs font-medium text-ink-muted">Fuel Type</label>
                    <p className="mt-1 text-sm font-medium text-ink-primary capitalize">{shift.fuelType}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-ink-muted">Start Reading</label>
                    <p className="mt-1 text-sm font-medium text-ink-primary">
                      {shift.startReading !== null ? shift.startReading.toFixed(1) : "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-ink-muted">End Reading</label>
                    <p className="mt-1 text-sm font-medium text-ink-primary">
                      {shift.endReading !== null ? shift.endReading.toFixed(1) : "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-ink-muted">Litres Sold</label>
                    <p className="mt-1 text-sm font-medium text-brand-500">{shift.litresSold.toFixed(2)} L</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-ink-muted">Hours Worked</label>
                    <p className="mt-1 text-sm font-medium text-ink-primary">{shift.hoursWorked.toFixed(2)}h</p>
                  </div>
                </div>

                {(shift.hasStartPhoto || shift.hasEndPhoto) && (
                  <div className="mt-4 flex gap-2">
                    {shift.hasStartPhoto && (
                      <span className="inline-block text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded">
                        📷 Start
                      </span>
                    )}
                    {shift.hasEndPhoto && (
                      <span className="inline-block text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded">
                        📷 End
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
