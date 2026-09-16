// @ts-nocheck
import { Badge } from "@/components/dashboard/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { OWNER_PAYMENTS, ownerPaymentSummary } from "@/lib/dashboard/data/pump-owner-portal";
import { formatCurrency } from "@/lib/dashboard/format";

export default function PumpOwnerPaymentsPage() {
  const summary = ownerPaymentSummary();
  const nextDue = OWNER_PAYMENTS.find((p) => p.status !== "Paid");

  return (
    <div className="space-y-6">
      <PageHeader title="Payments to Company" description="Your settlement history and outstanding balance." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total due" value={formatCurrency(summary.totalDue)} />
        <StatCard label="Total paid" value={formatCurrency(summary.totalPaid)} />
        <StatCard
          label="Remaining due"
          value={formatCurrency(summary.remainingDue)}
          tone={summary.remainingDue > 0 ? "rose" : "emerald"}
        />
        <StatCard label="Next due date" value={nextDue?.dueDate ?? "—"} />
      </div>

      <SectionCard title="Payment history">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Period</th>
                <th className="px-5 py-3 font-medium">Amount due</th>
                <th className="px-5 py-3 font-medium">Amount paid</th>
                <th className="px-5 py-3 font-medium">Due date</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {OWNER_PAYMENTS.map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{payment.period}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {formatCurrency(payment.amountDue)}
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {formatCurrency(payment.amountPaid)}
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{payment.dueDate}</td>
                  <td className="px-5 py-3">
                    <Badge>{payment.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
