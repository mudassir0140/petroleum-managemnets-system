// @ts-nocheck
import { Badge } from "@/components/dashboard/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { FUEL_PRICES } from "@/lib/dashboard/data/fuel-prices";
import { formatCurrency } from "@/lib/dashboard/format";

const CHANGE_TONE = {
  up: "text-emerald-600 dark:text-emerald-400",
  down: "text-rose-600 dark:text-rose-400",
  flat: "text-slate-500 dark:text-slate-400",
} as const;

export default function PumpOwnerFuelPricePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Fuel Price"
        description="Selling prices are set exclusively by the Company — this view is read-only."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {FUEL_PRICES.map((price) => (
          <SectionCard key={price.fuelType}>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{price.label}</p>
                <Badge tone={price.change === "up" ? "warning" : price.change === "down" ? "success" : "neutral"}>
                  {price.change === "flat" ? "No change" : `${price.change} Rs. ${price.changeAmount}`}
                </Badge>
              </div>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {formatCurrency(price.ourPrice)}
              </p>
              <p className={`mt-1 text-xs font-medium ${CHANGE_TONE[price.change]}`}>per liter</p>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Market avg {formatCurrency(price.marketAvg)} · Last updated {price.lastUpdated}
              </p>
            </div>
          </SectionCard>
        ))}
      </div>

      <SectionCard title="Price change log">
        <div className="p-5 text-sm text-slate-500 dark:text-slate-400">
          Prices are pushed company-wide whenever the Company Owner updates the live fuel price feed. Check the{" "}
          Live Fuel Prices page for the full change history.
        </div>
      </SectionCard>
    </div>
  );
}
