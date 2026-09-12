import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, type Column } from "@/components/ui/Table";
import { IconClock, IconTrendingUp, IconWallet } from "@/components/icons";
import { getCashierSession } from "@/lib/cashier/session";
import { getShiftHistory, getTransactionHistory } from "@/lib/cashier/shift-store";
import { simulateLatency } from "@/lib/utils";
import { formatCurrency, formatDate, formatDateTime, titleCase } from "@/lib/format";
import type { CashierShift, CashierTransaction } from "@/lib/cashier/types";

const METHOD_TONE = { cash: "brand", card: "good" } as const;
const CATEGORY_LABEL: Record<CashierTransaction["category"], string> = {
  fuel: "Fuel Sale",
  shop: "Shop / Convenience",
  service: "Service",
  other: "Other",
};

export default async function CashierHistoryPage() {
  await simulateLatency();
  const session = await getCashierSession();

  const shifts = getShiftHistory(session.cashierId, 30);
  const transactions = getTransactionHistory(session.cashierId, 100);

  const shiftsWorked = shifts.filter((s) => s.status === "closed").length;
  const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);

  const shiftColumns: Column<CashierShift>[] = [
    { header: "Date", cell: (row) => formatDate(row.date) },
    { header: "Shift", cell: (row) => titleCase(row.shift) },
    { header: "Status", cell: (row) => <Badge tone={row.status === "active" ? "good" : "neutral"}>{titleCase(row.status)}</Badge> },
    { header: "Started", cell: (row) => formatDateTime(row.startedAt) },
    { header: "Ended", cell: (row) => (row.endedAt ? formatDateTime(row.endedAt) : "—") },
  ];

  const transactionColumns: Column<CashierTransaction>[] = [
    { header: "Recorded", cell: (row) => formatDateTime(row.recordedAt) },
    { header: "Category", cell: (row) => CATEGORY_LABEL[row.category] },
    { header: "Description", cell: (row) => <span className="text-ink-muted">{row.description || "—"}</span> },
    { header: "Method", cell: (row) => <Badge tone={METHOD_TONE[row.paymentMethod]}>{titleCase(row.paymentMethod)}</Badge> },
    { header: "Amount", align: "right", cell: (row) => <span className="font-semibold">{formatCurrency(row.amount)}</span> },
  ];

  return (
    <div>
      <PageHeader title="Shift & Payment History" description="Your own shift attendance and recorded transactions." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Shifts completed" value={String(shiftsWorked)} icon={<IconClock size={19} />} accent="var(--brand-500)" />
        <KpiCard label="Transactions logged" value={String(transactions.length)} icon={<IconWallet size={19} />} accent="var(--series-1)" />
        <KpiCard label="Revenue collected" value={formatCurrency(totalRevenue)} icon={<IconTrendingUp size={19} />} accent="var(--series-7)" />
      </div>

      <Card className="mt-4">
        <CardHeader title="Shift attendance" subtitle="Every shift you've started, most recent first" />
        <Table columns={shiftColumns} rows={shifts} rowKey={(row) => row.id} emptyMessage="You haven't started a shift yet." />
      </Card>

      <Card className="mt-4">
        <CardHeader title="Transaction history" subtitle="Every payment you've recorded, most recent first" />
        <Table columns={transactionColumns} rows={transactions} rowKey={(row) => row.id} emptyMessage="No transactions recorded yet." />
      </Card>
    </div>
  );
}
