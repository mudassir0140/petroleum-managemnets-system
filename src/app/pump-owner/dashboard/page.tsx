import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Meter } from "@/components/ui/Meter";
import { Badge } from "@/components/ui/Badge";
import { LineAreaChart } from "@/components/charts/LineAreaChart";
import { BarChart } from "@/components/charts/BarChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { EmptyState } from "@/components/ui/States";
import { IconDroplet, IconTrendingUp, IconTruck, IconUsers, IconWallet, IconChevronRight } from "@/components/icons";
import { getSession } from "@/lib/session";
import {
  getAttendanceToday,
  getIncomingTankers,
  getPaymentSummary,
  getSalesHistory,
  getStaff,
  getStockSnapshots,
} from "@/lib/demo-data";
import { nowMs, simulateLatency } from "@/lib/utils";
import { formatCurrencyCompact, formatDateShort, formatDateTime, formatLitres, formatLitresCompact, titleCase } from "@/lib/format";
import { TANKER_STATUS_TONE, TANKER_STATUS_LABEL } from "@/lib/status-maps";

export default async function OverviewPage() {
  await simulateLatency();
  const session = await getSession();
  const pumpId = session.pumpId;

  const history = getSalesHistory(pumpId, 14);
  const today = history[history.length - 1];
  const yesterday = history[history.length - 2];
  const stock = getStockSnapshots(pumpId);
  const petrolStock = stock.find((s) => s.fuel === "petrol")!;
  const dieselStock = stock.find((s) => s.fuel === "diesel")!;
  const staff = getStaff(pumpId);
  const attendance = getAttendanceToday(pumpId);
  const presentCount = attendance.filter((a) => a.status === "present" || a.status === "late").length;
  const payments = getPaymentSummary(pumpId);
  const tankers = getIncomingTankers(pumpId)
    .slice()
    .sort((a, b) => new Date(a.expectedArrival).getTime() - new Date(b.expectedArrival).getTime());
  const now = nowMs();
  const upcomingTanker = tankers.find((t) => new Date(t.expectedArrival).getTime() > now);

  const revenueDeltaPct = yesterday.revenue ? Math.round(((today.revenue - yesterday.revenue) / yesterday.revenue) * 100) : 0;
  const todayLitres = today.petrolLitres + today.dieselLitres;
  const yesterdayLitres = yesterday.petrolLitres + yesterday.dieselLitres;
  const litresDeltaPct = yesterdayLitres ? Math.round(((todayLitres - yesterdayLitres) / yesterdayLitres) * 100) : 0;

  const daysToDue = Math.max(0, Math.round((new Date(payments.nextDueDate).getTime() - now) / 86400000));

  return (
    <div>
      <PageHeader title="Overview" description="Today's snapshot for your pump — updated in real time." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Today's revenue"
          value={formatCurrencyCompact(today.revenue)}
          delta={{ value: `${Math.abs(revenueDeltaPct)}% vs yesterday`, direction: revenueDeltaPct >= 0 ? "up" : "down", isGood: revenueDeltaPct >= 0 }}
          icon={<IconTrendingUp size={19} />}
          accent="var(--brand-500)"
          trend={history.map((d) => d.revenue)}
        />
        <KpiCard
          label="Today's litres sold"
          value={formatLitresCompact(todayLitres)}
          delta={{ value: `${Math.abs(litresDeltaPct)}% vs yesterday`, direction: litresDeltaPct >= 0 ? "up" : "down", isGood: litresDeltaPct >= 0 }}
          icon={<IconDroplet size={19} />}
          accent="var(--fuel-petrol)"
          trend={history.map((d) => d.petrolLitres + d.dieselLitres)}
        />
        <KpiCard
          label="Petrol stock"
          value={formatLitresCompact(petrolStock.currentLitres)}
          hint={`${Math.round((petrolStock.currentLitres / petrolStock.capacityLitres) * 100)}% of ${formatLitresCompact(petrolStock.capacityLitres)} tank`}
          icon={<IconDroplet size={19} />}
          accent="var(--fuel-petrol)"
        />
        <KpiCard
          label="Diesel stock"
          value={formatLitresCompact(dieselStock.currentLitres)}
          hint={`${Math.round((dieselStock.currentLitres / dieselStock.capacityLitres) * 100)}% of ${formatLitresCompact(dieselStock.capacityLitres)} tank`}
          icon={<IconDroplet size={19} />}
          accent="var(--fuel-diesel)"
        />
        <KpiCard
          label="Next tanker arrival"
          value={upcomingTanker ? formatDateTime(upcomingTanker.expectedArrival) : "None scheduled"}
          hint={upcomingTanker ? `${upcomingTanker.tankerNumber} · ${titleCase(upcomingTanker.fuel)} · ${formatLitres(upcomingTanker.expectedLitres)}` : undefined}
          icon={<IconTruck size={19} />}
          accent="var(--series-2)"
        />
        <KpiCard
          label="Staff present today"
          value={`${presentCount} / ${staff.length}`}
          hint={`${staff.length - presentCount} absent or on leave`}
          icon={<IconUsers size={19} />}
          accent="var(--series-7)"
        />
        <KpiCard
          label="Payment due to company"
          value={formatCurrencyCompact(payments.remainingDue)}
          hint={payments.remainingDue > 0 ? `Due in ${daysToDue} day${daysToDue === 1 ? "" : "s"}` : "Fully settled"}
          icon={<IconWallet size={19} />}
          accent={payments.remainingDue > 0 && daysToDue <= 5 ? "var(--status-critical)" : "var(--brand-500)"}
        />
        <Link href="/pump-owner/dashboard/tankers" className="group flex flex-col justify-between rounded-2xl border border-dashed border-border-subtle bg-surface-1 p-5 text-left transition-colors hover:border-brand-300 hover:bg-surface-2">
          <p className="text-xs font-medium text-ink-muted">Manage</p>
          <p className="mt-1.5 text-sm font-semibold text-ink-primary">View all tankers &amp; deliveries</p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-500">
            Open Incoming Tanker <IconChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Revenue trend" subtitle="Last 14 days, all shifts combined" />
          <LineAreaChart
            labels={history.map((d) => formatDateShort(d.date))}
            series={[{ name: "Revenue", color: "var(--brand-500)", data: history.map((d) => d.revenue), area: true }]}
            format="currencyCompact"
            tableCaption="Daily revenue for the last 14 days"
          />
        </Card>

        <Card>
          <CardHeader title="Today's fuel mix" subtitle="Litres dispensed by fuel type" />
          <DonutChart
            slices={[
              { name: "Petrol", color: "var(--fuel-petrol)", value: today.petrolLitres },
              { name: "Diesel", color: "var(--fuel-diesel)", value: today.dieselLitres },
            ]}
            format="litresCompact"
            centerLabel="Total litres"
            tableCaption="Today's litres sold by fuel type"
          />
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Shift-wise sales today" subtitle="Petrol vs diesel litres per shift" />
          <BarChart
            labels={today.shifts.map((s) => titleCase(s.shift))}
            series={[
              { name: "Petrol", color: "var(--fuel-petrol)", data: today.shifts.map((s) => s.petrolLitres) },
              { name: "Diesel", color: "var(--fuel-diesel)", data: today.shifts.map((s) => s.dieselLitres) },
            ]}
            format="litresCompact"
            tableCaption="Litres sold per shift today, by fuel type"
          />
        </Card>

        <Card>
          <CardHeader title="Cash vs card" subtitle="Today's revenue split" />
          <DonutChart
            slices={[
              { name: "Cash", color: "var(--series-1)", value: today.cashRevenue },
              { name: "Card", color: "var(--series-7)", value: today.cardRevenue },
            ]}
            format="currencyCompact"
            centerLabel="Total revenue"
            tableCaption="Today's revenue split between cash and card"
          />
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Tank levels" subtitle="Current stock vs full capacity" />
          <div className="space-y-5">
            <Meter label="Petrol" current={petrolStock.currentLitres} capacity={petrolStock.capacityLitres} color="var(--fuel-petrol)" formatValue={formatLitresCompact} />
            <Meter label="Diesel" current={dieselStock.currentLitres} capacity={dieselStock.capacityLitres} color="var(--fuel-diesel)" formatValue={formatLitresCompact} />
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Upcoming tankers"
            subtitle="Next deliveries to your pump"
            action={
              <Link href="/pump-owner/dashboard/tankers" className="text-xs font-medium text-brand-500 hover:underline">
                View all
              </Link>
            }
          />
          {tankers.length === 0 ? (
            <EmptyState title="No tankers scheduled" description="New deliveries will appear here as soon as they're scheduled." />
          ) : (
            <div className="space-y-3">
              {tankers.slice(0, 3).map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: t.fuel === "petrol" ? "var(--fuel-petrol-soft)" : "var(--fuel-diesel-soft)", color: t.fuel === "petrol" ? "var(--fuel-petrol)" : "var(--fuel-diesel)" }}>
                      <IconTruck size={17} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink-primary">{t.tankerNumber} · {titleCase(t.fuel)}</p>
                      <p className="text-xs text-ink-muted">{formatLitres(t.expectedLitres)} · {t.driverName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge tone={TANKER_STATUS_TONE[t.status]}>{TANKER_STATUS_LABEL[t.status]}</Badge>
                    <p className="mt-1 text-xs text-ink-muted">{formatDateTime(t.expectedArrival)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
