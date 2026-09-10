"use client";

import { useState } from "react";
import { CheckCircleIcon, DropletIcon } from "@/components/icons";
import { DashboardShell, type DashboardNavItem } from "@/components/ops/dashboard-shell";
import { FormField, inputClass } from "@/components/ops/modal";
import { PageHeader } from "@/components/ops/page-header";
import { SectionCard } from "@/components/ops/section-card";
import { useFuelPrices } from "@/lib/store/use-fuel-prices";

const OWNER_NAV: DashboardNavItem[] = [
  { href: "/owner-console", label: "Fuel Price Control", icon: DropletIcon },
];

export default function OwnerConsolePage() {
  const [priceState, setPriceState] = useFuelPrices();
  const [draft, setDraft] = useState(() =>
    Object.fromEntries(priceState.prices.map((p) => [p.product, p.pricePerLiter.toFixed(2)])),
  );
  const [saved, setSaved] = useState(false);

  function handlePublish(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPriceState((prev) => ({
      prices: prev.prices.map((price) => {
        const nextValue = Number(draft[price.product]);
        if (Number.isNaN(nextValue)) return price;
        return {
          ...price,
          change: Number((nextValue - price.pricePerLiter).toFixed(2)),
          pricePerLiter: nextValue,
        };
      }),
      updatedAt: "Just now",
      updatedBy: "Rajesh Kapoor · Company Owner",
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <DashboardShell
      nav={OWNER_NAV}
      roleLabel="Company Owner"
      roleTag="Owner Console"
      userName="Rajesh Kapoor"
      userInitials="RK"
      switchRoleHref="/manager"
      switchRoleLabel="Switch to Manager view"
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader
          title="Fuel Price Control"
          description="Owner-only control. Updates publish instantly to the Manager's Live Fuel Prices page and every Pump Owner."
        />

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          This is intentionally the only owner-level control exposed here — company-wide finance,
          payroll and access-control settings stay outside the Manager Dashboard.
        </div>

        {saved && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
            <CheckCircleIcon className="size-4 shrink-0" />
            Prices published. The Manager dashboard now reflects this instantly.
          </div>
        )}

        <SectionCard title="Today's fuel prices" description={`Last published ${priceState.updatedAt} by ${priceState.updatedBy}`}>
          <form onSubmit={handlePublish} className="space-y-4">
            {priceState.prices.map((price) => (
              <FormField key={price.product} label={`${price.product} (₹ / liter)`}>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={inputClass}
                  value={draft[price.product] ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, [price.product]: e.target.value }))
                  }
                />
              </FormField>
            ))}
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              Publish price update
            </button>
          </form>
        </SectionCard>
      </div>
    </DashboardShell>
  );
}
