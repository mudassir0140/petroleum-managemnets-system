"use client";

import { BackButton } from "@/components/dashboard/BackButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";

export default function DailyIncomePage() {
  // Demo data - would be fetched from API
  const dailyData = {
    date: new Date().toISOString().split("T")[0],
    litresSold: 125.5,
    amount: 37650,
    shifts: [
      { shift: "Morning", litres: 45.2, amount: 13560, status: "Closed" },
      { shift: "Afternoon", litres: 38.8, amount: 11640, status: "Closed" },
      { shift: "Evening", litres: 41.5, amount: 12450, status: "Active" },
    ],
  };

  return (
    <div>
      <BackButton />
      <PageHeader title="Daily Income / روزمرہ آمدنی" description="Today's sales summary" />

      <Card className="mb-6">
        <CardHeader title="Today's Summary / آج کا خلاصہ" />
        <div className="space-y-6 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="rounded-lg bg-surface-3 p-4">
              <label className="text-xs font-medium text-ink-muted uppercase">Total Litres / کل لیٹر</label>
              <p className="mt-2 text-2xl font-bold text-ink-primary">{dailyData.litresSold} L</p>
            </div>

            <div className="rounded-lg bg-surface-3 p-4">
              <label className="text-xs font-medium text-ink-muted uppercase">Total Amount / کل رقم</label>
              <p className="mt-2 text-2xl font-bold text-green-600">Rs {dailyData.amount.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Shift-wise Breakdown / شفٹ وار تفصیل" />
        <div className="space-y-3 p-6">
          {dailyData.shifts.map((shift, idx) => (
            <div key={idx} className="flex items-center justify-between rounded-lg border border-border-subtle p-4">
              <div>
                <p className="text-sm font-medium text-ink-primary">{shift.shift}</p>
                <p className="text-xs text-ink-muted">{shift.litres}L · Rs {shift.amount.toLocaleString()}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                shift.status === "Closed"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              }`}>
                {shift.status}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
