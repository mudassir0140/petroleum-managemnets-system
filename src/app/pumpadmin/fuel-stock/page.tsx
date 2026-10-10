import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Meter } from "@/components/ui/Meter";
import { StockHistoryTable } from "@/components/dashboard/StockHistoryTable";
import { IconDroplet } from "@/components/icons";
import { getSession } from "@/lib/session";
import { getStockHistory, getStockSnapshots } from "@/lib/demo-data";
import { simulateLatency } from "@/lib/utils";
import { formatLitres } from "@/lib/format";
import type { StockSnapshot } from "@/lib/types";

function StockDetailCard({ snapshot, color, softColor }: { snapshot: StockSnapshot; color: string; softColor: string }) {
  const remaining = snapshot.currentLitres;
  return (
    <Card>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: softColor, color }}>
          <IconDroplet size={20} />
        </div>
        <div>
          <p className="text-sm font-semibold capitalize text-ink-primary">{snapshot.fuel}</p>
          <p className="text-xs text-ink-muted">Tank capacity {formatLitres(snapshot.capacityLitres)}</p>
        </div>
      </div>

      <Meter label="Current level" current={snapshot.currentLitres} capacity={snapshot.capacityLitres} color={color} formatValue={formatLitres} />

      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border-subtle pt-4 text-center">
        <div>
          <p className="text-xs text-ink-muted">Received (7d)</p>
          <p className="mt-1 text-sm font-semibold text-ink-primary">{formatLitres(snapshot.receivedLitres7d)}</p>
        </div>
        <div>
          <p className="text-xs text-ink-muted">Sold (7d)</p>
          <p className="mt-1 text-sm font-semibold text-ink-primary">{formatLitres(snapshot.soldLitres7d)}</p>
        </div>
        <div>
          <p className="text-xs text-ink-muted">Remaining</p>
          <p className="mt-1 text-sm font-semibold text-ink-primary">{formatLitres(remaining)}</p>
        </div>
      </div>

      {snapshot.currentLitres <= snapshot.reorderLevelLitres && (
        <p className="mt-4 rounded-lg px-3 py-2 text-xs font-medium" style={{ background: "color-mix(in srgb, var(--status-critical) 12%, transparent)", color: "var(--status-critical)" }}>
          Stock is at or below the {formatLitres(snapshot.reorderLevelLitres)} reorder level — consider requesting a delivery.
        </p>
      )}
    </Card>
  );
}

export default async function FuelStockPage() {
  await simulateLatency();
  const session = await getSession();
  const stock = getStockSnapshots(session.pumpId);
  const history = getStockHistory(session.pumpId, 21);

  const petrol = stock.find((s) => s.fuel === "petrol")!;
  const diesel = stock.find((s) => s.fuel === "diesel")!;

  return (
    <div>
      <PageHeader title="Fuel Stock" description="Live tank levels and stock movement for your pump only." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StockDetailCard snapshot={petrol} color="var(--fuel-petrol)" softColor="var(--fuel-petrol-soft)" />
        <StockDetailCard snapshot={diesel} color="var(--fuel-diesel)" softColor="var(--fuel-diesel-soft)" />
      </div>

      <Card className="mt-4">
        <CardHeader title="Stock history" subtitle="Deliveries, daily depletion and adjustments — last 21 days" />
        <StockHistoryTable entries={history} />
      </Card>
    </div>
  );
}
