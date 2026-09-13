"use client";

import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import { OWNER_PAYMENTS, ownerPump } from "@/lib/dashboard/data/pump-owner-portal";
import { formatCurrency, formatLiters } from "@/lib/dashboard/format";
import { FUEL_TYPE_LABELS } from "@/lib/dashboard/data/stations";

export default function PumpOwnerReportsPage() {
  const pump = ownerPump();

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Combined sales and payment history for your pump." />

      <SectionCard
        title="Today's sales by fuel"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv(
                `${pump.id}-sales-report`,
                pump.todaySales.map((s) => ({
                  Fuel: FUEL_TYPE_LABELS[s.fuelType],
                  Liters: s.liters,
                  "Revenue (Rs.)": s.revenue,
                })),
              )
            }
          />
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Fuel</th>
                <th className="px-5 py-3 font-medium">Liters</th>
                <th className="px-5 py-3 font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {pump.todaySales.map((sale) => (
                <tr key={sale.fuelType} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {FUEL_TYPE_LABELS[sale.fuelType]}
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatLiters(sale.liters)}</td>
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                    {formatCurrency(sale.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title="Payment history"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv(
                `${pump.id}-payment-report`,
                OWNER_PAYMENTS.map((p) => ({
                  Period: p.period,
                  "Amount Due (Rs.)": p.amountDue,
                  "Amount Paid (Rs.)": p.amountPaid,
                  Status: p.status,
                  "Due Date": p.dueDate,
                })),
              )
            }
          />
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Period</th>
                <th className="px-5 py-3 font-medium">Due</th>
                <th className="px-5 py-3 font-medium">Paid</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {OWNER_PAYMENTS.map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{payment.period}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {formatCurrency(payment.amountDue)}
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {formatCurrency(payment.amountPaid)}
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{payment.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
