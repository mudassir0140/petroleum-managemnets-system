"use client";

import { useState } from "react";
import { CheckCircleIcon, DropletIcon, TrendingUpIcon } from "@/components/icons";
import { SectionCard } from "@/components/ops/section-card";
import { PageHeader } from "@/components/ops/page-header";
import { StatCard } from "@/components/ops/stat-card";
import { FUEL_PRICE_HISTORY_SEED } from "@/lib/data/fuel-prices";
import { CHAT_CONVERSATIONS, useChatMessages } from "@/lib/store/use-chat";
import { useFuelPrices } from "@/lib/store/use-fuel-prices";

export default function LiveFuelPricesPage() {
  const [priceState] = useFuelPrices();
  const { sendMessage } = useChatMessages();
  const [broadcasted, setBroadcasted] = useState(false);

  function broadcastToOwners() {
    const summary = priceState.prices
      .map((p) => `${p.product}: ₹${p.pricePerLiter.toFixed(2)}/L`)
      .join(" · ");
    CHAT_CONVERSATIONS.forEach((conversation) => {
      sendMessage(conversation.id, `Updated fuel prices effective ${priceState.updatedAt}: ${summary}`);
    });
    setBroadcasted(true);
    setTimeout(() => setBroadcasted(false), 3000);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Fuel Prices"
        description="Synced automatically from the Company Owner's fuel price panel — no separate price system."
        actions={
          <button
            type="button"
            onClick={broadcastToOwners}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            <DropletIcon className="size-4" />
            Broadcast to all pump owners
          </button>
        }
      />

      {broadcasted && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
          <CheckCircleIcon className="size-4 shrink-0" />
          Latest prices sent to all {CHAT_CONVERSATIONS.length} pump owners via chat.
        </div>
      )}

      <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300">
        Last updated <span className="font-semibold">{priceState.updatedAt}</span> by{" "}
        <span className="font-semibold">{priceState.updatedBy}</span>. This page reflects that
        update immediately — refresh not required.
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {priceState.prices.map((price) => (
          <StatCard
            key={price.product}
            label={price.product}
            value={`₹${price.pricePerLiter.toFixed(2)} / L`}
            hint={`${price.change >= 0 ? "+" : ""}₹${price.change.toFixed(2)} vs yesterday`}
            icon={TrendingUpIcon}
            tone={price.change >= 0 ? "emerald" : "rose"}
          />
        ))}
      </div>

      <SectionCard
        title="Price update history"
        description="Every change published by the Company Owner"
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium text-right">Price / L</th>
                <th className="px-5 py-3 font-medium">Effective from</th>
                <th className="px-5 py-3 font-medium">Updated by</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {FUEL_PRICE_HISTORY_SEED.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                    {entry.product}
                  </td>
                  <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-300">
                    ₹{entry.pricePerLiter.toFixed(2)}
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {entry.effectiveFrom}
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {entry.updatedBy}
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
