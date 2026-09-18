import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { ShiftControlCard } from "@/components/attendant/ShiftControlCard";
import { IconChevronRight, IconClock, IconDroplet, IconTrendingUp, IconWallet } from "@/components/icons";
import { getAttendantSession } from "@/lib/attendant/session";
import { computeShiftTotals, getActiveShift, getTodaySalesSummary } from "@/lib/attendant/shift-store";
import { simulateLatency } from "@/lib/utils";
import { formatCurrencyCompact, formatLitresCompact, titleCase } from "@/lib/format";
import { SHIFT_TIMES } from "@/lib/demo-data";

export default async function AttendantOverviewPage() {
  await simulateLatency();
  const session = await getAttendantSession();
  const activeShift = await getActiveShift(session.attendantId);
  const totals = activeShift
    ? await computeShiftTotals(activeShift.id)
    : { petrolLitres: 0, dieselLitres: 0, cashTotal: 0, cardTotal: 0, revenueTotal: 0, transactionCount: 0 };
  const today = await getTodaySalesSummary(session.attendantId);
  const shiftTimes = SHIFT_TIMES[session.assignedShift];

  return (
    <div>
      <PageHeader title="Overview" description={`Welcome back, ${session.attendantName.split(" ")[0]}.`} />

      <Card className="mb-4">
        <CardHeader
          title="Your shift"
          subtitle={`Assigned shift: ${titleCase(session.assignedShift)} (${shiftTimes.start} – ${shiftTimes.end})`}
        />
        <ShiftControlCard assignedShift={session.assignedShift} activeShift={activeShift} totals={totals} />
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Today's litres" value={formatLitresCompact(today.petrolLitres + today.dieselLitres)} icon={<IconDroplet size={19} />} accent="var(--fuel-petrol)" />
        <KpiCard label="Today's revenue" value={formatCurrencyCompact(today.revenueTotal)} icon={<IconTrendingUp size={19} />} accent="var(--brand-500)" />
        <KpiCard label="Cash collected" value={formatCurrencyCompact(today.cashTotal)} icon={<IconWallet size={19} />} accent="var(--series-1)" />
        <KpiCard label="Card collected" value={formatCurrencyCompact(today.cardTotal)} icon={<IconWallet size={19} />} accent="var(--series-7)" />
      </div>

      <Card className="mt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
              <IconClock size={19} />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink-primary">Ready to dispense?</p>
              <p className="text-xs text-ink-muted">Log petrol and diesel sales as you serve customers.</p>
            </div>
          </div>
          <Link href="/attendant/dashboard/dispense" className="inline-flex items-center gap-1 text-xs font-medium text-brand-500 hover:underline">
            Open Dispense &amp; Sales <IconChevronRight size={14} />
          </Link>
        </div>
      </Card>
    </div>
  );
}
