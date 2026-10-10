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
  compact?: boolean;
}

export function KpiCard({ label, value, delta, icon, accent = "var(--brand-500)", trend, hint, compact = false }: KpiCardProps) {
  return (
    <div className={`rounded-2xl border border-border-subtle bg-surface-1 shadow-sm ${compact ? "p-3" : "p-5"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`font-medium text-ink-muted ${compact ? "text-[10px]" : "text-xs"}`}>{label}</p>
          <p className={`font-semibold text-ink-primary ${compact ? "mt-1 text-lg" : "mt-1.5 text-2xl"}`}>{value}</p>
        </div>
        {icon && (
          <div
            className={`shrink-0 items-center justify-center rounded-lg flex ${compact ? "h-7 w-7" : "h-10 w-10"}`}
            style={{ background: `color-mix(in srgb, ${accent} 14%, transparent)`, color: accent }}
          >
            {icon}
          </div>
        )}
      </div>
      <div className={`flex items-center justify-between gap-2 ${compact ? "mt-2" : "mt-3"}`}>
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
