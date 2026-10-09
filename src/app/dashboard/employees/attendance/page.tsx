"use client";

import { useEffect, useState } from "react";
import { BackButton } from "@/components/dashboard/BackButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";

interface AttendanceRecord {
  id: string;
  date: string;
  loginAt: string;
  logoutAt: string | null;
}

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAttendance() {
      try {
        const response = await fetch("/api/employee/attendance?limit=50");
        if (!response.ok) throw new Error("Failed to fetch attendance");

        const result = await response.json();
        setRecords(result.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchAttendance();
  }, []);

  const hoursWorked = (record: AttendanceRecord) => {
    if (!record.logoutAt) return "Still Active";
    const login = new Date(record.loginAt);
    const logout = new Date(record.logoutAt);
    const hours = (logout.getTime() - login.getTime()) / (1000 * 60 * 60);
    return `${hours.toFixed(2)} hours`;
  };

  const currentMonth = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
  const totalDays = records.length;
  const presentDays = records.filter((r) => r.logoutAt).length;

  return (
    <div>
      <BackButton />
      <PageHeader
        title="Attendance / حاضری"
        description={`Your attendance records for ${currentMonth}`}
      />

      <Card className="mb-6">
        <CardHeader title="Attendance Summary / حاضری کا خلاصہ" />
        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
          <div className="rounded-lg bg-surface-3 p-4">
            <label className="text-xs font-medium text-ink-muted uppercase">Total Days / کل دن</label>
            <p className="mt-2 text-2xl font-bold text-ink-primary">{totalDays}</p>
          </div>
          <div className="rounded-lg bg-surface-3 p-4">
            <label className="text-xs font-medium text-ink-muted uppercase">Present Days / موجود دن</label>
            <p className="mt-2 text-2xl font-bold text-green-600">{presentDays}</p>
          </div>
          <div className="rounded-lg bg-surface-3 p-4">
            <label className="text-xs font-medium text-ink-muted uppercase">Attendance % / حاضری %</label>
            <p className="mt-2 text-2xl font-bold text-ink-primary">
              {totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0}%
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Detailed Records / تفصیلی ریکارڈ" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="px-4 py-3 text-left font-medium text-ink-muted">Date</th>
                <th className="px-4 py-3 text-left font-medium text-ink-muted">Login Time</th>
                <th className="px-4 py-3 text-left font-medium text-ink-muted">Logout Time</th>
                <th className="px-4 py-3 text-left font-medium text-ink-muted">Hours Worked</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-ink-muted">
                    Loading...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-rose-600">
                    {error}
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-ink-muted">
                    No attendance records yet
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="border-b border-border-subtle hover:bg-surface-2">
                    <td className="px-4 py-3 text-ink-primary font-medium">{record.date}</td>
                    <td className="px-4 py-3 text-ink-primary">
                      {new Date(record.loginAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-ink-primary">
                      {record.logoutAt
                        ? new Date(record.logoutAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-ink-primary">{hoursWorked(record)}</td>
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
