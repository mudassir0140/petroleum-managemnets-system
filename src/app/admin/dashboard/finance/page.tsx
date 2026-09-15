import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, type Column } from "@/components/ui/Table";
import { WalletIcon, TrendingUpIcon } from "@/components/icons";
import { getAdminSession } from "@/lib/admin/session";
import { simulateLatency } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

interface Transaction {
  id: string;
  type: "payment" | "expense" | "revenue";
  description: string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "failed";
}

export default async function FinancePage() {
  await simulateLatency();
  const session = await getAdminSession();

  const transactions: Transaction[] = [
    { id: "TXN-001", type: "revenue", description: "Daily sales - PUMP-014", amount: 45000, date: "2024-09-14", status: "completed" },
    { id: "TXN-002", type: "payment", description: "Pump owner payment - Fahad Malik", amount: 35000, date: "2024-09-14", status: "completed" },
    { id: "TXN-003", type: "expense", description: "Staff salary payment", amount: 125000, date: "2024-09-13", status: "completed" },
    { id: "TXN-004", type: "revenue", description: "Daily sales - PUMP-021", amount: 52000, date: "2024-09-13", status: "completed" },
    { id: "TXN-005", type: "expense", description: "Tanker maintenance", amount: 15000, date: "2024-09-12", status: "pending" },
  ];

  const columns: Column<Transaction>[] = [
    { header: "Type", cell: (row) => <Badge tone={row.type === "revenue" ? "good" : row.type === "expense" ? "critical" : "warning"}>{row.type}</Badge> },
    { header: "Description", cell: (row) => <span className="font-medium text-ink-primary">{row.description}</span> },
    { header: "Amount", cell: (row) => <span className="font-semibold text-ink-primary">{formatCurrency(row.amount)}</span> },
    { header: "Date", cell: (row) => <span className="text-sm text-ink-secondary">{new Date(row.date).toLocaleDateString()}</span> },
    { header: "Status", cell: (row) => <Badge tone={row.status === "completed" ? "good" : row.status === "pending" ? "warning" : "critical"}>{row.status}</Badge> },
  ];

  const totalRevenue = transactions.filter(t => t.type === "revenue").reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance & Payments Management"
        description="Manage company finances, track payments, expenses, and generate financial reports."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Total Revenue" value={formatCurrency(totalRevenue)} icon={<TrendingUpIcon size={19} />} accent="var(--series-2)" />
        <KpiCard label="Total Expenses" value={formatCurrency(totalExpenses)} icon={<WalletIcon size={19} />} accent="var(--series-6)" />
        <KpiCard label="Net Profit" value={formatCurrency(netProfit)} icon={<TrendingUpIcon size={19} />} accent="var(--brand-500)" />
      </div>

      <Card>
        <CardHeader title="Recent Transactions" subtitle="Latest payments, expenses, and revenue entries" />
        <Table columns={columns} rows={transactions} rowKey={(row) => row.id} />
      </Card>
    </div>
  );
}
