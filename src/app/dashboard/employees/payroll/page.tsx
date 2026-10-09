"use client";

import { useEffect, useState } from "react";
import { BackButton } from "@/components/dashboard/BackButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";

interface DailyIncome {
  date: string;
  litres: number;
  amount: number;
  fuelType: string;
}

interface IncomeData {
  period: string;
  month: string;
  totalLitres: number;
  totalAmount: number;
  dailyData: DailyIncome[];
  rates: {
    petrol: number;
    diesel: number;
  };
}

export default function PayrollPage() {
  const [data, setData] = useState<IncomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    async function fetchIncome() {
      try {
        const response = await fetch(`/api/employee/income?period=monthly&month=${selectedMonth}`);
        if (!response.ok) throw new Error("Failed to fetch income");

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchIncome();
  }, [selectedMonth]);

  const monthLabel = data
    ? new Date(`${data.month}-01`).toLocaleString("en-US", { month: "long", year: "numeric" })
    : "";

  return (
    <div>
      <BackButton />
      <PageHeader
        title="Payroll / تنخواہیں"
        description="Your income and earnings summary"
      />

      <div className="mb-6 flex gap-2">
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="rounded-lg border border-border-subtle px-3 py-2 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {loading ? (
        <Card>
          <div className="p-6 text-center text-ink-muted">Loading...</div>
        </Card>
      ) : error ? (
        <Card>
          <div className="p-6 text-center text-rose-600">{error}</div>
        </Card>
      ) : data ? (
        <>
          <Card className="mb-6">
            <CardHeader title={`Monthly Summary / ماہانہ خلاصہ (${monthLabel})`} />
            <div className="space-y-6 p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-surface-3 p-4">
                  <label className="text-xs font-medium text-ink-muted uppercase">Total Litres / کل لیٹر</label>
                  <p className="mt-2 text-2xl font-bold text-ink-primary">{data.totalLitres} L</p>
                </div>
                <div className="rounded-lg bg-surface-3 p-4">
                  <label className="text-xs font-medium text-ink-muted uppercase">Total Income / کل آمدنی</label>
                  <p className="mt-2 text-2xl font-bold text-green-600">
                    Rs {data.totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border-subtle p-4">
                  <label className="text-xs font-medium text-ink-muted uppercase">Petrol Rate / پیٹرول کی قیمت</label>
                  <p className="mt-2 text-lg font-bold text-ink-primary">Rs {data.rates.petrol}/L</p>
                </div>
                <div className="rounded-lg border border-border-subtle p-4">
                  <label className="text-xs font-medium text-ink-muted uppercase">Diesel Rate / ڈیزل کی قیمت</label>
                  <p className="mt-2 text-lg font-bold text-ink-primary">Rs {data.rates.diesel}/L</p>
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
                    <th className="px-4 py-3 text-left font-medium text-ink-muted">Date / تاریخ</th>
                    <th className="px-4 py-3 text-left font-medium text-ink-muted">Fuel Type / ایندھن کی قسم</th>
                    <th className="px-4 py-3 text-right font-medium text-ink-muted">Litres / لیٹر</th>
                    <th className="px-4 py-3 text-right font-medium text-ink-muted">Income (Rs) / آمدنی</th>
                  </tr>
                </thead>
                <tbody>
                  {data.dailyData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-ink-muted">
                        No data for this month
                      </td>
                    </tr>
                  ) : (
                    data.dailyData.map((day, idx) => (
                      <tr key={idx} className="border-b border-border-subtle hover:bg-surface-2">
                        <td className="px-4 py-3 text-ink-primary font-medium">{day.date}</td>
                        <td className="px-4 py-3 text-ink-primary capitalize">{day.fuelType}</td>
                        <td className="px-4 py-3 text-right text-ink-primary">{day.litres.toFixed(2)} L</td>
                        <td className="px-4 py-3 text-right text-green-600 font-medium">
                          {day.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}
