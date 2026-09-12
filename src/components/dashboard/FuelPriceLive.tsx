"use client";

import { useFuelPrice } from "@/hooks/useFuelPrice";
import { IconDroplet, IconShield } from "@/components/icons";
import { formatRelativeToNow, formatTime } from "@/lib/format";
import type { FuelPriceState } from "@/lib/types";

function PriceCard({
  label,
  value,
  prevValue,
  color,
  softColor,
  flash,
}: {
  label: string;
  value: number;
  prevValue: number;
  color: string;
  softColor: string;
  flash: boolean;
}) {
  const diff = Math.round((value - prevValue) * 100) / 100;
  const direction = diff > 0 ? "up" : diff < 0 ? "down" : "flat";

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-border-subtle bg-surface-1 p-6 transition-shadow"
      style={{ boxShadow: flash ? `0 0 0 3px color-mix(in srgb, ${color} 35%, transparent)` : undefined }}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: softColor, color }}>
          <IconDroplet size={22} />
        </div>
        <div>
          <p className="text-sm font-medium text-ink-secondary">{label}</p>
          <p className="text-xs text-ink-muted">per litre</p>
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tabular-nums text-ink-primary">Rs {value.toFixed(2)}</span>
        {direction !== "flat" && (
          <span
            className="inline-flex items-center gap-0.5 text-xs font-medium"
            style={{ color: direction === "up" ? "var(--status-critical)" : "var(--status-good-text)" }}
          >
            {direction === "up" ? "▲" : "▼"} Rs {Math.abs(diff).toFixed(2)}
          </span>
        )}
      </div>

      {flash && (
        <span
          className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{ background: "color-mix(in srgb, var(--status-good) 18%, transparent)", color: "var(--status-good-text)" }}
        >
          Updated
        </span>
      )}
    </div>
  );
}

export function FuelPriceLive({ initial }: { initial: FuelPriceState }) {
  const { price, justChanged } = useFuelPrice(initial);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: "var(--status-good)" }} />
            <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "var(--status-good)" }} />
          </span>
          Live — updates automatically
        </div>
        {/* Relative time reads differently between server render and client hydration by design — suppress the mismatch warning rather than delaying the first paint. */}
        <p className="text-xs text-ink-muted" suppressHydrationWarning>
          Last changed {formatRelativeToNow(price.updatedAt)} ({formatTime(price.updatedAt)})
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PriceCard label="Petrol (PMG 92)" value={price.petrol} prevValue={price.petrolPrev} color="var(--fuel-petrol)" softColor="var(--fuel-petrol-soft)" flash={justChanged} />
        <PriceCard label="Diesel (HSD)" value={price.diesel} prevValue={price.dieselPrev} color="var(--fuel-diesel)" softColor="var(--fuel-diesel-soft)" flash={justChanged} />
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-border-subtle bg-surface-2/60 p-3.5">
        <IconShield size={16} className="mt-0.5 shrink-0 text-ink-muted" />
        <p className="text-xs leading-relaxed text-ink-muted">
          Selling prices are set exclusively by the Company and pushed to every pump automatically. As a Pump Owner your
          dashboard is <span className="font-medium text-ink-secondary">read-only</span> for pricing — you cannot edit these
          values here or anywhere else in the system.
        </p>
      </div>
    </div>
  );
}
