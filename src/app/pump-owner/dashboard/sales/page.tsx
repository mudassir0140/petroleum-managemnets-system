import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { SalesExplorer } from "@/components/dashboard/SalesExplorer";
import { IconDroplet, IconTrendingUp, IconWallet } from "@/components/icons";
import { getSession } from "@/lib/session";
import { getSalesHistory } from "@/lib/demo-data";
import { simulateLatency } from "@/lib/utils";
import { formatCurrencyCompact, formatLitresCompact, titleCase } from "@/lib/format";

export default async function SalesPage() {
  await simulateLatency();
  const session = await getSession();
  const history = getSalesHistory(session.pumpId, 30);
  const today = history[history.length - 1];
  const bestShift = [...today.shifts].sort((a, b) => b.revenue - a.revenue)[0];

  return (
    <div>
      <PageHeader title="Sales" description="Daily, shift-wise and payment-method sales for your pump." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Today's petrol sold" value={formatLitresCompact(today.petrolLitres)} icon={<IconDroplet size={19} />} accent="var(--fuel-petrol)" />
        <KpiCard label="Today's diesel sold" value={formatLitresCompact(today.dieselLitres)} icon={<IconDroplet size={19} />} accent="var(--fuel-diesel)" />
        <KpiCard label="Today's revenue" value={formatCurrencyCompact(today.revenue)} icon={<IconTrendingUp size={19} />} accent="var(--brand-500)" />
        <KpiCard
          label="Best shift today"
          value={titleCase(bestShift.shift)}
          hint={`${formatCurrencyCompact(bestShift.revenue)} revenue`}
          icon={<IconWallet size={19} />}
          accent="var(--series-7)"
        />
      </div>

      <div className="mt-4">
        <SalesExplorer history={history} />
      </div>
    </div>
  );
}
