import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, type Column } from "@/components/ui/Table";
import { IconBuilding, IconDroplet, IconTrendingUp, IconWallet } from "@/components/icons";
import { getAdminSession } from "@/lib/admin/session";
import { PUMPS, getPaymentSummary, getTodaySales } from "@/lib/demo-data";
import { simulateLatency } from "@/lib/utils";
import { formatCurrency, formatCurrencyCompact, formatPumpAddress } from "@/lib/format";
import type { Pump } from "@/lib/types";

interface PumpRow extends Pump {
  todayRevenue: number;
  outstanding: number;
}

export default async function AdminOverviewPage() {
  await simulateLatency();
  const session = await getAdminSession();

  const rows: PumpRow[] = PUMPS.map((pump) => ({
    ...pump,
    todayRevenue: getTodaySales(pump.id).revenue,
    outstanding: getPaymentSummary(pump.id).remainingDue,
  }));

  const onlineCount = rows.filter((r) => r.online).length;
  const totalRevenueToday = rows.reduce((sum, r) => sum + r.todayRevenue, 0);
  const totalOutstanding = rows.reduce((sum, r) => sum + r.outstanding, 0);

  const columns: Column<PumpRow>[] = [
    { header: "Pump", cell: (row) => <span className="font-medium text-ink-primary">{row.name}</span> },
    { header: "Owner", cell: (row) => row.ownerName },
    { header: "Location", cell: (row) => formatPumpAddress(row) },
    { header: "Status", cell: (row) => <Badge tone={row.online ? "good" : "neutral"}>{row.online ? "Online" : "Offline"}</Badge> },
    { header: "Today's revenue", align: "right", cell: (row) => formatCurrency(row.todayRevenue) },
    { header: "Outstanding", align: "right", cell: (row) => formatCurrency(row.outstanding) },
  ];

  return (
    <div>
      <PageHeader
        title="Network Overview"
        description={`Welcome back, ${session.adminName.split(" ")[0]}. A read-only view across every pump in the network.`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total pumps" value={String(rows.length)} icon={<IconBuilding size={19} />} accent="var(--brand-500)" />
        <KpiCard label="Online now" value={`${onlineCount} / ${rows.length}`} icon={<IconDroplet size={19} />} accent="var(--fuel-petrol)" />
        <KpiCard label="Revenue today" value={formatCurrencyCompact(totalRevenueToday)} icon={<IconTrendingUp size={19} />} accent="var(--series-7)" />
        <KpiCard label="Outstanding to Company" value={formatCurrencyCompact(totalOutstanding)} icon={<IconWallet size={19} />} accent="var(--series-1)" />
      </div>

      <Card className="mt-4">
        <CardHeader title="Pumps" subtitle="Every pump registered on the platform" />
        <Table columns={columns} rows={rows} rowKey={(row) => row.id} />
      </Card>
    </div>
  );
}
