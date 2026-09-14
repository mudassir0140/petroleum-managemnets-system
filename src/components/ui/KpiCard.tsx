import type { ReactNode } from "react";
import { Sparkline } from "@/components/charts/Sparkline";

interface KpiCardProps {
  label: string;
  value: string;
  delta?: { value: string; direction: "up" | "down"; isGood: boolean };
  icon?: ReactNode;
  accent?: string;
  trend?: number[];
  hint?: string;
}

export function KpiCard({ label, value, delta, icon, accent = "var(--brand-500)", trend, hint }: KpiCardProps) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-1 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-ink-muted">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold text-ink-primary">{value}</p>
        </div>
        {icon && (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: `color-mix(in srgb, ${accent} 14%, transparent)`, color: accent }}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        {delta ? (
          <span
            className="inline-flex items-center gap-1 text-xs font-medium"
            style={{ color: delta.isGood ? "var(--status-good-text)" : "var(--status-critical)" }}
          >
            {delta.direction === "up" ? "▲" : "▼"} {delta.value}
          </span>
        ) : hint ? (
          <span className="text-xs text-ink-muted">{hint}</span>
        ) : (
          <span />
        )}
        {trend && trend.length >= 2 && <Sparkline data={trend} accent={accent} />}
      </div>
    </div>
  );
}
