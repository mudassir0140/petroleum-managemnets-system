"use client";

import { BackButton } from "@/components/dashboard/BackButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";

export default function MonthlyIncomePage() {
  // Demo data - would be fetched from API
  const monthlyData = {
    month: "October 2026",
    totalLitres: 3850.75,
    totalAmount: 1155225,
    dailyBreakdown: [
      { date: "Oct 1", litres: 125.5, amount: 37650 },
      { date: "Oct 2", litres: 118.3, amount: 35490 },
      { date: "Oct 3", litres: 132.8, amount: 39840 },
      { date: "Oct 4", litres: 145.2, amount: 43560 },
      { date: "Oct 5", litres: 138.6, amount: 41580 },
    ],
  };

  return (
    <div>
      <BackButton />
      <PageHeader
        title="Monthly Income / ماہانہ آمدنی"
        description={monthlyData.month}
      />

      <Card className="mb-6">
        <CardHeader title="Monthly Summary / ماہانہ خلاصہ" />
        <div className="space-y-6 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="rounded-lg bg-surface-3 p-4">
              <label className="text-xs font-medium text-ink-muted uppercase">Total Litres / کل لیٹر</label>
              <p className="mt-2 text-2xl font-bold text-ink-primary">{monthlyData.totalLitres} L</p>
            </div>

            <div className="rounded-lg bg-surface-3 p-4">
              <label className="text-xs font-medium text-ink-muted uppercase">Total Amount / کل رقم</label>
              <p className="mt-2 text-2xl font-bold text-green-600">Rs {monthlyData.totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Day-by-Day Breakdown / روز بروز تفصیل" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="px-4 py-3 text-left font-medium text-ink-muted">Date</th>
                <th className="px-4 py-3 text-right font-medium text-ink-muted">Litres</th>
                <th className="px-4 py-3 text-right font-medium text-ink-muted">Amount (Rs)</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.dailyBreakdown.map((day, idx) => (
                <tr key={idx} className="border-b border-border-subtle hover:bg-surface-2">
                  <td className="px-4 py-3 text-ink-primary">{day.date}</td>
                  <td className="px-4 py-3 text-right text-ink-primary">{day.litres}</td>
                  <td className="px-4 py-3 text-right text-green-600 font-medium">{day.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
