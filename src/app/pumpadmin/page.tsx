import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { FuelRatesWidget } from "@/components/dashboard/FuelRatesWidget";
import { IconDroplet, IconTrendingUp, IconTruck, IconUsers, IconWallet, IconChevronRight, IconFileText, IconTag, IconChat } from "@/components/icons";
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
import { formatCurrencyCompact, formatDateTime, formatLitresCompact } from "@/lib/format";

export default async function OverviewPage() {
  await simulateLatency();
  const session = await getSession();
  const pumpId = session.pumpId;

  const history = await getSalesHistory(pumpId, 14);
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

      <FuelRatesWidget />

      <div className="grid grid-cols-1 gap-2 md:grid-cols-3 lg:grid-cols-6">
        <KpiCard
          label="Today's revenue"
          value={formatCurrencyCompact(today.revenue)}
          delta={{ value: `${Math.abs(revenueDeltaPct)}% vs yesterday`, direction: revenueDeltaPct >= 0 ? "up" : "down", isGood: revenueDeltaPct >= 0 }}
          icon={<IconTrendingUp size={14} />}
          accent="var(--brand-500)"
          compact
        />
        <KpiCard
          label="Today's litres sold"
          value={formatLitresCompact(todayLitres)}
          delta={{ value: `${Math.abs(litresDeltaPct)}% vs yesterday`, direction: litresDeltaPct >= 0 ? "up" : "down", isGood: litresDeltaPct >= 0 }}
          icon={<IconDroplet size={14} />}
          accent="var(--fuel-petrol)"
          compact
        />
        <KpiCard
          label="Petrol stock"
          value={formatLitresCompact(petrolStock.currentLitres)}
          hint={`${Math.round((petrolStock.currentLitres / petrolStock.capacityLitres) * 100)}%`}
          icon={<IconDroplet size={14} />}
          accent="var(--fuel-petrol)"
          compact
        />
        <KpiCard
          label="Diesel stock"
          value={formatLitresCompact(dieselStock.currentLitres)}
          hint={`${Math.round((dieselStock.currentLitres / dieselStock.capacityLitres) * 100)}%`}
          icon={<IconDroplet size={14} />}
          accent="var(--fuel-diesel)"
          compact
        />
        <KpiCard
          label="Next tanker"
          value={upcomingTanker ? formatDateTime(upcomingTanker.expectedArrival) : "None"}
          hint={upcomingTanker ? `${upcomingTanker.tankerNumber}` : undefined}
          icon={<IconTruck size={14} />}
          accent="var(--series-2)"
          compact
        />
        <KpiCard
          label="Staff present"
          value={`${presentCount} / ${staff.length}`}
          hint={`${staff.length - presentCount} absent`}
          icon={<IconUsers size={14} />}
          accent="var(--series-7)"
          compact
        />
        <KpiCard
          label="Payment due"
          value={formatCurrencyCompact(payments.remainingDue)}
          hint={payments.remainingDue > 0 ? `${daysToDue}d` : "Settled"}
          icon={<IconWallet size={14} />}
          accent={payments.remainingDue > 0 && daysToDue <= 5 ? "var(--status-critical)" : "var(--brand-500)"}
          compact
        />
        <Link href="/pumpadmin/tankers" className="group flex flex-col justify-between rounded-xl border border-dashed border-border-subtle bg-surface-1 p-3 text-left transition-colors hover:border-brand-300 hover:bg-surface-2">
          <p className="text-[10px] font-medium text-ink-muted">Manage</p>
          <p className="mt-1 text-xs font-semibold text-ink-primary">View tankers</p>
          <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-brand-500">
            Open <IconChevronRight size={12} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-ink-primary mb-4">Pages</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/pumpadmin/fuel-stock" className="group flex flex-col justify-between rounded-2xl border border-border-subtle bg-surface-1 p-5 text-left transition-colors hover:border-brand-300 hover:bg-surface-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                <IconDroplet size={20} />
              </div>
            </div>
            <p className="text-sm font-semibold text-ink-primary">Fuel Stock</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-500">
              Open <IconChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>

          <Link href="/pumpadmin/sales" className="group flex flex-col justify-between rounded-2xl border border-border-subtle bg-surface-1 p-5 text-left transition-colors hover:border-brand-300 hover:bg-surface-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                <IconTrendingUp size={20} />
              </div>
            </div>
            <p className="text-sm font-semibold text-ink-primary">Sales</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-500">
              Open <IconChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>

          <Link href="/pumpadmin/tankers" className="group flex flex-col justify-between rounded-2xl border border-border-subtle bg-surface-1 p-5 text-left transition-colors hover:border-brand-300 hover:bg-surface-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                <IconTruck size={20} />
              </div>
            </div>
            <p className="text-sm font-semibold text-ink-primary">Incoming Tanker</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-500">
              Open <IconChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>

          <Link href="/pumpadmin/fuel-orders" className="group flex flex-col justify-between rounded-2xl border border-border-subtle bg-surface-1 p-5 text-left transition-colors hover:border-brand-300 hover:bg-surface-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                <IconFileText size={20} />
              </div>
            </div>
            <p className="text-sm font-semibold text-ink-primary">Fuel Orders</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-500">
              Open <IconChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>

          <Link href="/pumpadmin/connect" className="group flex flex-col justify-between rounded-2xl border border-border-subtle bg-surface-1 p-5 text-left transition-colors hover:border-brand-300 hover:bg-surface-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                <IconChat size={20} />
              </div>
            </div>
            <p className="text-sm font-semibold text-ink-primary">Connect & Chat</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-500">
              Open <IconChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>

          <Link href="/pumpadmin/fuel-price" className="group flex flex-col justify-between rounded-2xl border border-border-subtle bg-surface-1 p-5 text-left transition-colors hover:border-brand-300 hover:bg-surface-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                <IconTag size={20} />
              </div>
            </div>
            <p className="text-sm font-semibold text-ink-primary">Live Fuel Price</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-500">
              Open <IconChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>

          <Link href="/pumpadmin/employees" className="group flex flex-col justify-between rounded-2xl border border-border-subtle bg-surface-1 p-5 text-left transition-colors hover:border-brand-300 hover:bg-surface-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                <IconUsers size={20} />
              </div>
            </div>
            <p className="text-sm font-semibold text-ink-primary">Employees</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-500">
              Open <IconChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>

          <Link href="/pumpadmin/khata" className="group flex flex-col justify-between rounded-2xl border border-border-subtle bg-surface-1 p-5 text-left transition-colors hover:border-brand-300 hover:bg-surface-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                <IconFileText size={20} />
              </div>
            </div>
            <p className="text-sm font-semibold text-ink-primary">Khata</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-500">
              Open <IconChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
