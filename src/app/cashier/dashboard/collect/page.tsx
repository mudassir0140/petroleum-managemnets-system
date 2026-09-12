import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, type Column } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/States";
import { TransactionForm } from "@/components/cashier/TransactionForm";
import { IconWallet } from "@/components/icons";
import { getCashierSession } from "@/lib/cashier/session";
import { getActiveShift, getTransactionsForShift } from "@/lib/cashier/shift-store";
import { simulateLatency } from "@/lib/utils";
import { formatCurrency, formatTime, titleCase } from "@/lib/format";
import type { CashierTransaction } from "@/lib/cashier/types";

const METHOD_TONE = { cash: "brand", card: "good" } as const;
const CATEGORY_LABEL: Record<CashierTransaction["category"], string> = {
  fuel: "Fuel Sale",
  shop: "Shop / Convenience",
  service: "Service",
  other: "Other",
};

export default async function CollectPaymentPage() {
  await simulateLatency();
  const session = await getCashierSession();
  const activeShift = getActiveShift(session.cashierId);
  const entries = activeShift ? getTransactionsForShift(activeShift.id) : [];

  const columns: Column<CashierTransaction>[] = [
    { header: "Time", cell: (row) => formatTime(row.recordedAt) },
    { header: "Category", cell: (row) => CATEGORY_LABEL[row.category] },
    { header: "Description", cell: (row) => <span className="text-ink-muted">{row.description || "—"}</span> },
    { header: "Method", cell: (row) => <Badge tone={METHOD_TONE[row.paymentMethod]}>{titleCase(row.paymentMethod)}</Badge> },
    { header: "Amount", align: "right", cell: (row) => <span className="font-semibold">{formatCurrency(row.amount)}</span> },
  ];

  return (
    <div>
      <PageHeader title="Collect Payment" description="Record every cash or card transaction as customers pay." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="New transaction" subtitle="Pick a category and payment method" />
          <TransactionForm shiftActive={!!activeShift} />
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="This shift's transaction log"
            subtitle={activeShift ? `${titleCase(activeShift.shift)} shift · started ${formatTime(activeShift.startedAt)}` : "Start your shift to begin logging"}
          />
          {!activeShift ? (
            <EmptyState icon={<IconWallet size={20} />} title="No active shift" description="Start your shift from the Overview page to record transactions here." />
          ) : entries.length === 0 ? (
            <EmptyState title="No transactions yet" description="Entries you record will appear here in real time." />
          ) : (
            <Table columns={columns} rows={entries} rowKey={(row) => row.id} />
          )}
        </Card>
      </div>
    </div>
  );
}
