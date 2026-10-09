import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { FuelPriceLive } from "@/components/dashboard/FuelPriceLive";
import { LineAreaChart } from "@/components/charts/LineAreaChart";
import { getCurrentFuelPrice, getFuelPriceHistory } from "@/lib/fuel-price-store";
import { simulateLatency } from "@/lib/utils";
import { formatDateShort } from "@/lib/format";

export default async function FuelPricePage() {
  await simulateLatency();
  const initial = getCurrentFuelPrice();
  const history = getFuelPriceHistory(14);

  return (
    <div>
      <PageHeader title="Live Fuel Price" description="Company-controlled selling prices for your pump." />

      <Card>
        <FuelPriceLive initial={initial} />
      </Card>

      <Card className="mt-4">
        <CardHeader title="Price trend" subtitle="Last 14 days, as set by the Company" />
        <LineAreaChart
          labels={history.map((h) => formatDateShort(h.date))}
          series={[
            { name: "Petrol", color: "var(--fuel-petrol)", data: history.map((h) => h.petrol) },
            { name: "Diesel", color: "var(--fuel-diesel)", data: history.map((h) => h.diesel) },
          ]}
          format="currency"
          tableCaption="Petrol and diesel price trend for the last 14 days"
        />
      </Card>
    </div>
  );
}
