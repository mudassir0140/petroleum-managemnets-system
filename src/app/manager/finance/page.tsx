"use client";

import { CreditCardIcon, TankIcon, WalletIcon } from "@/components/icons";
import { PageHeader } from "@/components/ops/page-header";
import { SectionCard } from "@/components/ops/section-card";
import { StatCard } from "@/components/ops/stat-card";
import { PUMPS } from "@/lib/data/pumps";
import { formatCurrency, formatLiters } from "@/lib/format";
import { useFuelPrices } from "@/lib/store/use-fuel-prices";

const PAYMENT_SPLIT = [
  { method: "UPI", percent: 47, color: "bg-sky-500" },
  { method: "Cash", percent: 38, color: "bg-amber-500" },
  { method: "Card", percent: 15, color: "bg-emerald-500" },
];

const FUEL_MIX_SHARE: Record<string, number> = {
  Petrol: 0.42,
  Diesel: 0.46,
  "Premium / Power Petrol": 0.12,
};

export default function DailyFinancePage() {
  const [{ prices }] = useFuelPrices();

  const totalCollections = PUMPS.reduce((sum, p) => sum + p.todaySalesValue, 0);
  const totalLiters = PUMPS.reduce((sum, p) => sum + p.todaySalesLiters, 0);

  const fuelDistribution = prices.map((price) => {
    const share = FUEL_MIX_SHARE[price.product] ?? 0;
    const liters = Math.round(totalLiters * share);
    const value = liters * price.pricePerLiter;
    return { ...price, liters, value };
  });

  const sortedPumps = [...PUMPS].sort((a, b) => b.todaySalesValue - a.todaySalesValue);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Finance"
        description="Today's operational collections and fuel distributed by value — network-wide figures for the day only."
      />

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
        This view is limited to today&apos;s operational totals. Payroll, expenses, budgets and
        full company financials are managed by the Company Owner.
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Today's collections"
          value={formatCurrency(totalCollections)}
          hint="Across all open pumps"
          icon={WalletIcon}
          tone="emerald"
        />
        <StatCard
          label="Fuel distributed by value"
          value={formatCurrency(fuelDistribution.reduce((s, f) => s + f.value, 0))}
          hint={formatLiters(totalLiters) + " dispensed"}
          icon={TankIcon}
          tone="amber"
        />
        <StatCard
          label="Avg. realisation / liter"
          value={`₹${(totalCollections / (totalLiters || 1)).toFixed(2)}`}
          hint="Blended across products"
          icon={CreditCardIcon}
          tone="sky"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Fuel distributed by value" description="Today, network-wide">
          <div className="space-y-4">
            {fuelDistribution.map((fuel) => (
              <div key={fuel.product}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {fuel.product}
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(fuel.value)}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                    style={{ width: `${(fuel.value / (totalCollections || 1)) * 100}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {formatLiters(fuel.liters)} at ₹{fuel.pricePerLiter.toFixed(2)}/L
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Collections by payment method" description="Estimated split, today">
          <div className="space-y-4">
            {PAYMENT_SPLIT.map((item) => (
              <div key={item.method}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {item.method}
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency((totalCollections * item.percent) / 100)}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Today's collections by pump" noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Pump</th>
                <th className="px-5 py-3 font-medium text-right">Liters sold</th>
                <th className="px-5 py-3 font-medium text-right">Collections</th>
                <th className="px-5 py-3 font-medium text-right">% of network</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedPumps.map((pump) => (
                <tr key={pump.id}>
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">{pump.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{pump.code}</p>
                  </td>
                  <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-300">
                    {formatLiters(pump.todaySalesLiters)}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(pump.todaySalesValue)}
                  </td>
                  <td className="px-5 py-3 text-right text-slate-500 dark:text-slate-400">
                    {((pump.todaySalesValue / (totalCollections || 1)) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
