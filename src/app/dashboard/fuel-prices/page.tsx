"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { TrendingUpIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import { FUEL_PRICES, PRICE_LOG, type FuelPrice } from "@/lib/dashboard/data/fuel-prices";
import { FUEL_TYPE_LABELS } from "@/lib/dashboard/data/stations";

function jitter(prices: FuelPrice[]): FuelPrice[] {
  return prices.map((price) => {
    if (Math.random() > 0.5) return price;
    const delta = Math.round((Math.random() - 0.5) * 4);
    if (delta === 0) return price;
    const newPrice = Math.max(1, price.ourPrice + delta);
    return {
      ...price,
      ourPrice: newPrice,
      change: delta > 0 ? "up" : "down",
      changeAmount: Math.abs(delta),
      lastUpdated: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };
  });
}

export default function FuelPricesPage() {
  const [prices, setPrices] = useState<FuelPrice[]>(FUEL_PRICES);

  useEffect(() => {
    const id = setInterval(() => setPrices((prev) => jitter(prev)), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Fuel Prices"
        description="Company pricing vs. market average and competitor range — visible to Managers and every Pump Owner."
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
            Live
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {prices.map((price) => (
          <div key={price.fuelType} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {price.label}
              </p>
              <TrendingUpIcon
                className={`size-4 ${
                  price.change === "up"
                    ? "text-emerald-500"
                    : price.change === "down"
                      ? "rotate-90 text-rose-500"
                      : "text-slate-400"
                }`}
              />
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
              Rs. {price.ourPrice}
              <span className="text-sm font-normal text-slate-400"> /L</span>
            </p>
            <p
              className={`mt-1 text-xs font-medium ${
                price.change === "up"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : price.change === "down"
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-slate-500"
              }`}
            >
              {price.change === "up" ? "▲" : price.change === "down" ? "▼" : "—"} Rs. {price.changeAmount} since last update
            </p>
            <div className="mt-4 space-y-1.5 border-t border-slate-200 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <div className="flex justify-between"><span>Market average</span><span>Rs. {price.marketAvg}</span></div>
              <div className="flex justify-between"><span>Competitor range</span><span>Rs. {price.competitorLow} – Rs. {price.competitorHigh}</span></div>
              <div className="flex justify-between"><span>Last updated</span><span>{price.lastUpdated}</span></div>
            </div>
          </div>
        ))}
      </div>

      <SectionCard
        title="Price change log"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("price-log", PRICE_LOG.map((p) => ({
                ID: p.id,
                "Fuel Type": p.fuelType,
                "Old Price": p.oldPrice,
                "New Price": p.newPrice,
                "Changed By": p.changedBy,
                Date: p.date,
              })))
            }
          />
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Fuel</th>
                <th className="px-5 py-3 font-medium">Change</th>
                <th className="px-5 py-3 font-medium">Changed by</th>
                <th className="px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {PRICE_LOG.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3">
                    <Badge tone="neutral">{FUEL_TYPE_LABELS[entry.fuelType]}</Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    Rs. {entry.oldPrice} → Rs. {entry.newPrice}
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{entry.changedBy}</td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{entry.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
