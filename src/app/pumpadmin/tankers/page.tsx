import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { TankersBoard } from "@/components/dashboard/TankersBoard";
import { IconClock, IconTruck, IconAlertTriangle } from "@/components/icons";
import { getSession } from "@/lib/session";
import { getIncomingTankers } from "@/lib/demo-data";
import { nowMs, simulateLatency } from "@/lib/utils";
import { formatDateTime, formatLitres } from "@/lib/format";

export default async function TankersPage() {
  await simulateLatency();
  const session = await getSession();
  const tankers = getIncomingTankers(session.pumpId);

  const now = nowMs();
  const upcoming = tankers
    .filter((t) => new Date(t.expectedArrival).getTime() > now)
    .sort((a, b) => new Date(a.expectedArrival).getTime() - new Date(b.expectedArrival).getTime());
  const delayedCount = tankers.filter((t) => t.status === "delayed").length;
  const totalIncomingLitres = upcoming.reduce((sum, t) => sum + t.expectedLitres, 0);

  return (
    <div>
      <PageHeader title="Incoming Tanker" description="Track fuel deliveries scheduled for your pump." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Next arrival"
          value={upcoming[0] ? formatDateTime(upcoming[0].expectedArrival) : "None scheduled"}
          hint={upcoming[0]?.tankerNumber}
          icon={<IconClock size={19} />}
          accent="var(--brand-500)"
        />
        <KpiCard label="Litres incoming" value={formatLitres(totalIncomingLitres)} hint={`${upcoming.length} upcoming deliveries`} icon={<IconTruck size={19} />} accent="var(--fuel-petrol)" />
        <KpiCard
          label="Delayed deliveries"
          value={String(delayedCount)}
          hint={delayedCount > 0 ? "Needs attention" : "All on schedule"}
          icon={<IconAlertTriangle size={19} />}
          accent={delayedCount > 0 ? "var(--status-critical)" : "var(--brand-500)"}
        />
      </div>

      <Card className="mt-4">
        <CardHeader title="All deliveries" subtitle="Scheduled, in-transit and completed tanker deliveries to your pump" />
        <TankersBoard tankers={tankers} />
      </Card>
    </div>
  );
}
