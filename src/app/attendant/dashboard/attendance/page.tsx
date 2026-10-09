"use client";

import { BackButton } from "@/components/dashboard/BackButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";

export default function AttendancePage() {
  // Demo data - would be fetched from API
  const attendanceRecords = [
    {
      id: "1",
      date: "2026-10-09",
      status: "Present",
      checkInTime: "06:00 AM",
      checkOutTime: "02:00 PM",
      shift: "Morning",
    },
    {
      id: "2",
      date: "2026-10-08",
      status: "Present",
      checkInTime: "06:15 AM",
      checkOutTime: "02:30 PM",
      shift: "Morning",
    },
    {
      id: "3",
      date: "2026-10-07",
      status: "Absent",
      checkInTime: "-",
      checkOutTime: "-",
      shift: "-",
    },
  ];

  return (
    <div>
      <BackButton />
      <PageHeader
        title="Attendance / حاضری"
        description="Your attendance history"
      />

      {attendanceRecords.length === 0 ? (
        <EmptyState title="No attendance records" description="Your attendance records will appear here." />
      ) : (
        <div className="space-y-3">
          {attendanceRecords.map((record) => (
            <Card key={record.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="text-sm font-semibold text-ink-primary">{record.date}</p>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        record.status === "Present"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {record.status}
                    </span>
                  </div>
                  {record.status === "Present" && (
                    <>
                      <p className="text-xs text-ink-muted">
                        Shift: <span className="font-medium text-ink-secondary">{record.shift}</span>
                      </p>
                      <p className="text-xs text-ink-muted">
                        Time: {record.checkInTime} - {record.checkOutTime}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
