"use client";

import { BackButton } from "@/components/dashboard/BackButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";

export default function ShiftsPage() {
  // Demo data - would be fetched from API
  const shifts = [
    {
      id: "1",
      date: "2026-10-05",
      startTime: "06:00 AM",
      endTime: "02:00 PM",
      startReading: 1234.5,
      endReading: 1345.2,
      litresSold: 110.7,
      status: "Closed",
      approval: "Approved",
    },
    {
      id: "2",
      date: "2026-10-04",
      startTime: "02:00 PM",
      endTime: "10:00 PM",
      startReading: 1120.8,
      endReading: 1234.5,
      litresSold: 113.7,
      status: "Closed",
      approval: "Pending",
    },
    {
      id: "3",
      date: "2026-10-03",
      startTime: "06:00 AM",
      endTime: "02:00 PM",
      startReading: 1005.2,
      endReading: 1120.8,
      litresSold: 115.6,
      status: "Closed",
      approval: "Approved",
    },
  ];

  return (
    <div>
      <BackButton />
      <PageHeader
        title="Shifts & Attendance / شفٹیں اور حاضری"
        description="Your shift records and status"
      />

      <div className="space-y-4">
        {shifts.map((shift) => (
          <Card key={shift.id}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-ink-primary">{shift.date}</p>
                  <p className="text-xs text-ink-muted">{shift.startTime} - {shift.endTime}</p>
                </div>
                <div className="flex gap-2">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    shift.status === "Closed"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  }`}>
                    {shift.status}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    shift.approval === "Approved"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                  }`}>
                    {shift.approval}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-medium text-ink-muted">Start Reading</label>
                  <p className="mt-1 text-sm font-medium text-ink-primary">{shift.startReading}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-muted">End Reading</label>
                  <p className="mt-1 text-sm font-medium text-ink-primary">{shift.endReading}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-muted">Litres Sold</label>
                  <p className="mt-1 text-sm font-medium text-ink-primary">{shift.litresSold} L</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-muted">Photos</label>
                  <p className="mt-1 text-xs text-brand-500">Start & End</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
