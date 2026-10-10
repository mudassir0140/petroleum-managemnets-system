import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Meter } from "@/components/ui/Meter";
import { Table, type Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { DonutChart } from "@/components/charts/DonutChart";
import { IconWallet, IconCalendar, IconCheck, IconClock } from "@/components/icons";
import { getSession } from "@/lib/session";
import { getPaymentSummary } from "@/lib/demo-data";
import { nowMs, simulateLatency } from "@/lib/utils";
import { formatCurrency, formatCurrencyCompact, formatDate, titleCase } from "@/lib/format";
import type { PaymentRecord } from "@/lib/types";

const METHOD_TONE = { cash: "brand", card: "good", bank_transfer: "neutral" } as const;
const METHOD_COLOR: Record<string, string> = {
  cash: "var(--series-1)",
  card: "var(--series-3)",
  bank_transfer: "var(--series-7)",
};

export default async function PaymentsPage() {
  await simulateLatency();
  const session = await getSession();
  const summary = getPaymentSummary(session.pumpId);

  const daysToDue = Math.round((new Date(summary.nextDueDate).getTime() - nowMs()) / 86400000);

  const byMethod = summary.history.reduce<Record<string, number>>((acc, p) => {
    acc[p.method] = (acc[p.method] ?? 0) + p.amount;
    return acc;
  }, {});

  const columns: Column<PaymentRecord>[] = [
    { header: "Date", cell: (row) => formatDate(row.date) },
    { header: "Amount", align: "right", cell: (row) => <span className="font-semibold">{formatCurrency(row.amount)}</span> },
    { header: "Method", cell: (row) => <Badge tone={METHOD_TONE[row.method as keyof typeof METHOD_TONE] ?? "neutral"}>{titleCase(row.method)}</Badge> },
    { header: "Note", cell: (row) => <span className="text-ink-muted">{row.note}</span> },
    {
      header: "Status",
      cell: (row) => (
        <Badge tone={row.status === "completed" ? "good" : "warning"}>
          {row.status === "completed" ? "Completed" : "Pending"}
        </Badge>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Payments to Company" description="Your pump's settlement account with the Company — advances, dues and history." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total due this cycle" value={formatCurrencyCompact(summary.totalDueThisCycle)} icon={<IconWallet size={19} />} accent="var(--brand-500)" />
        <KpiCard label="Advance paid" value={formatCurrencyCompact(summary.advancePaid)} icon={<IconCheck size={19} />} accent="var(--status-good)" />
        <KpiCard
          label="Remaining due"
          value={formatCurrencyCompact(summary.remainingDue)}
          icon={<IconClock size={19} />}
          accent={summary.remainingDue > 0 ? "var(--status-critical)" : "var(--brand-500)"}
        />
        <KpiCard
          label="Next due date"
          value={formatDate(summary.nextDueDate)}
          hint={daysToDue >= 0 ? `in ${daysToDue} day${daysToDue === 1 ? "" : "s"}` : "overdue"}
          icon={<IconCalendar size={19} />}
          accent={daysToDue <= 5 ? "var(--status-warning)" : "var(--brand-500)"}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Current cycle progress" subtitle={`Total paid all-time: ${formatCurrency(summary.totalPaidAllTime)}`} />
          <Meter
            label="Advance paid vs total due"
            current={summary.advancePaid}
            capacity={summary.totalDueThisCycle}
            color="var(--brand-500)"
            formatValue={formatCurrencyCompact}
          />
          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border-subtle pt-4 text-center">
            <div>
              <p className="text-xs text-ink-muted">Total due</p>
              <p className="mt-1 text-sm font-semibold text-ink-primary">{formatCurrency(summary.totalDueThisCycle)}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Advance paid</p>
              <p className="mt-1 text-sm font-semibold text-ink-primary">{formatCurrency(summary.advancePaid)}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Remaining</p>
              <p className="mt-1 text-sm font-semibold" style={{ color: summary.remainingDue > 0 ? "var(--status-critical)" : "var(--status-good-text)" }}>
                {formatCurrency(summary.remainingDue)}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Payments by method" subtitle="Across recorded history" />
          <DonutChart
            slices={Object.entries(byMethod).map(([method, value]) => ({ name: titleCase(method), color: METHOD_COLOR[method], value }))}
            format="currencyCompact"
            centerLabel="Total paid"
            tableCaption="Payments to company grouped by payment method"
          />
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader title="Payment history" subtitle="All settlements made to the Company for this pump" />
        <Table columns={columns} rows={summary.history} rowKey={(row) => row.id} />
      </Card>
    </div>
  );
}
