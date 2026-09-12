import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Table, type Column } from "@/components/ui/Table";
import { IconFileText, IconTrendingUp, IconWallet } from "@/components/icons";
import { getCashierSession } from "@/lib/cashier/session";
import { getDailyCashHistory, getHandoverHistory } from "@/lib/cashier/shift-store";
import { simulateLatency } from "@/lib/utils";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import type { CashHandover, DailyCashSummary } from "@/lib/cashier/types";

export default async function CashierReportsPage() {
  await simulateLatency();
  const session = await getCashierSession();

  const dailyCash = getDailyCashHistory(session.cashierId, 30);
  const handovers = getHandoverHistory(session.cashierId, 30);

  const totalRevenue30d = dailyCash.reduce((sum, d) => sum + d.revenueTotal, 0);
  const totalCash30d = dailyCash.reduce((sum, d) => sum + d.cashTotal, 0);

  const dailyColumns: Column<DailyCashSummary>[] = [
    { header: "Date", cell: (row) => formatDate(row.date) },
    { header: "Transactions", align: "right", cell: (row) => String(row.transactionCount) },
    { header: "Cash", align: "right", cell: (row) => formatCurrency(row.cashTotal) },
    { header: "Card", align: "right", cell: (row) => formatCurrency(row.cardTotal) },
    { header: "Revenue", align: "right", cell: (row) => <span className="font-semibold">{formatCurrency(row.revenueTotal)}</span> },
  ];

  const handoverColumns: Column<CashHandover>[] = [
    { header: "Submitted", cell: (row) => formatDateTime(row.submittedAt) },
    { header: "Handed to", cell: (row) => row.handoverTo },
    { header: "Expected cash", align: "right", cell: (row) => formatCurrency(row.cashExpected) },
    { header: "Counted", align: "right", cell: (row) => formatCurrency(row.cashCounted) },
    {
      header: "Variance",
      align: "right",
      cell: (row) => (
        <span style={{ color: row.variance === 0 ? undefined : row.variance > 0 ? "var(--status-good-text)" : "var(--status-critical)" }}>
          {row.variance > 0 ? "+" : ""}
          {formatCurrency(row.variance)}
        </span>
      ),
    },
    { header: "Notes", cell: (row) => <span className="text-ink-muted">{row.notes || "—"}</span> },
  ];

  return (
    <div>
      <PageHeader title="Daily Cash Report" description="Daily collection totals and shift-end reconciliations for the last 30 days." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Revenue (30 days)" value={formatCurrency(totalRevenue30d)} icon={<IconTrendingUp size={19} />} accent="var(--brand-500)" />
        <KpiCard label="Cash collected (30 days)" value={formatCurrency(totalCash30d)} icon={<IconWallet size={19} />} accent="var(--series-1)" />
        <KpiCard label="Handovers submitted" value={String(handovers.length)} icon={<IconFileText size={19} />} accent="var(--series-7)" />
      </div>

      <Card className="mt-4">
        <CardHeader title="Daily cash summary" subtitle="Your own logged collections — last 30 days" />
        <Table columns={dailyColumns} rows={dailyCash} rowKey={(row) => row.date} emptyMessage="No transactions logged yet." />
      </Card>

      <Card className="mt-4">
        <CardHeader title="Shift handovers" subtitle="Cash reconciliation submitted at the end of each shift" />
        <Table columns={handoverColumns} rows={handovers} rowKey={(row) => row.id} emptyMessage="No shift has been handed over yet." />
      </Card>
    </div>
  );
}
