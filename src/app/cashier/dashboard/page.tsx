import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { ShiftControlCard } from "@/components/cashier/ShiftControlCard";
import { IconChevronRight, IconClock, IconTrendingUp, IconWallet } from "@/components/icons";
import { getCashierSession } from "@/lib/cashier/session";
import { computeShiftTotals, getActiveShift, getTodayCashSummary } from "@/lib/cashier/shift-store";
import { simulateLatency } from "@/lib/utils";
import { formatCurrency, titleCase } from "@/lib/format";
import { SHIFT_TIMES } from "@/lib/demo-data";

export default async function CashierOverviewPage() {
  await simulateLatency();
  const session = await getCashierSession();
  const activeShift = getActiveShift(session.cashierId);
  const totals = activeShift ? computeShiftTotals(activeShift.id) : { cashTotal: 0, cardTotal: 0, revenueTotal: 0, transactionCount: 0 };
  const today = getTodayCashSummary(session.cashierId);
  const shiftTimes = SHIFT_TIMES[session.assignedShift];

  return (
    <div>
      <PageHeader title="Overview" description={`Welcome back, ${session.cashierName.split(" ")[0]}.`} />

      <Card className="mb-4">
        <CardHeader
          title="Your shift"
          subtitle={`Assigned shift: ${titleCase(session.assignedShift)} (${shiftTimes.start} – ${shiftTimes.end})`}
        />
        <ShiftControlCard assignedShift={session.assignedShift} activeShift={activeShift} totals={totals} />
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Today's revenue" value={formatCurrency(today.revenueTotal)} icon={<IconTrendingUp size={19} />} accent="var(--brand-500)" />
        <KpiCard label="Cash collected" value={formatCurrency(today.cashTotal)} icon={<IconWallet size={19} />} accent="var(--series-1)" />
        <KpiCard label="Card collected" value={formatCurrency(today.cardTotal)} icon={<IconWallet size={19} />} accent="var(--series-7)" />
        <KpiCard label="Transactions today" value={String(today.transactionCount)} icon={<IconClock size={19} />} accent="var(--series-3)" />
      </div>

      <Card className="mt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
              <IconWallet size={19} />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink-primary">Ready to collect a payment?</p>
              <p className="text-xs text-ink-muted">Record cash or card transactions as customers pay.</p>
            </div>
          </div>
          <Link href="/cashier/dashboard/collect" className="inline-flex items-center gap-1 text-xs font-medium text-brand-500 hover:underline">
            Open Collect Payment <IconChevronRight size={14} />
          </Link>
        </div>
      </Card>
    </div>
  );
}
