import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, type Column } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/States";
import { DispenseForm } from "@/components/attendant/DispenseForm";
import { IconDroplet } from "@/components/icons";
import { getAttendantSession } from "@/lib/attendant/session";
import { getActiveShift, getSalesForShift } from "@/lib/attendant/shift-store";
import { getCurrentFuelPrice } from "@/lib/fuel-price-store";
import { simulateLatency } from "@/lib/utils";
import { formatCurrency, formatLitres, formatTime, titleCase } from "@/lib/format";
import type { SaleEntry } from "@/lib/attendant/types";

const METHOD_TONE = { cash: "brand", card: "good" } as const;

export default async function DispensePage() {
  await simulateLatency();
  const session = await getAttendantSession();
  const activeShift = await getActiveShift(session.attendantId);
  const price = getCurrentFuelPrice();
  const entries = activeShift ? await getSalesForShift(activeShift.id) : [];

  const columns: Column<SaleEntry>[] = [
    { header: "Time", cell: (row) => formatTime(row.recordedAt) },
    { header: "Fuel", cell: (row) => titleCase(row.fuel) },
    { header: "Litres", align: "right", cell: (row) => formatLitres(row.litres) },
    { header: "Unit price", align: "right", cell: (row) => `Rs ${row.unitPrice.toFixed(2)}` },
    { header: "Method", cell: (row) => <Badge tone={METHOD_TONE[row.paymentMethod]}>{titleCase(row.paymentMethod)}</Badge> },
    { header: "Amount", align: "right", cell: (row) => <span className="font-semibold">{formatCurrency(row.amount)}</span> },
  ];

  return (
    <div>
      <PageHeader title="Dispense & Sales" description="Log every petrol and diesel sale as you serve it, with the payment method used." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="New sale" subtitle="Company-set prices apply automatically" />
          <DispenseForm shiftActive={!!activeShift} petrolPrice={price.petrol} dieselPrice={price.diesel} />
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="This shift's sales log" subtitle={activeShift ? `${titleCase(activeShift.shift)} shift · started ${formatTime(activeShift.startedAt)}` : "Start your shift to begin logging"} />
          {!activeShift ? (
            <EmptyState icon={<IconDroplet size={20} />} title="No active shift" description="Start your shift from the Overview page to log sales here." />
          ) : entries.length === 0 ? (
            <EmptyState title="No sales logged yet" description="Entries you log will appear here in real time." />
          ) : (
            <Table columns={columns} rows={entries} rowKey={(row) => row.id} />
          )}
        </Card>
      </div>
    </div>
  );
}
