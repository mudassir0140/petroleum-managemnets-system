type BadgeTone = "good" | "warning" | "serious" | "critical" | "neutral" | "brand";

const TONE_STYLES: Record<BadgeTone, { bg: string; fg: string; dot: string }> = {
  good: { bg: "color-mix(in srgb, var(--status-good) 14%, transparent)", fg: "var(--status-good-text)", dot: "var(--status-good)" },
  warning: { bg: "color-mix(in srgb, var(--status-warning) 20%, transparent)", fg: "var(--accent-700)", dot: "var(--status-warning)" },
  serious: { bg: "color-mix(in srgb, var(--status-serious) 18%, transparent)", fg: "var(--status-critical)", dot: "var(--status-serious)" },
  critical: { bg: "color-mix(in srgb, var(--status-critical) 14%, transparent)", fg: "var(--status-critical)", dot: "var(--status-critical)" },
  neutral: { bg: "var(--surface-3)", fg: "var(--ink-secondary)", dot: "var(--ink-muted)" },
  brand: { bg: "color-mix(in srgb, var(--brand-500) 14%, transparent)", fg: "var(--brand-600)", dot: "var(--brand-500)" },
};

export function Badge({ children, tone = "neutral", dot = true }: { children: string; tone?: BadgeTone; dot?: boolean }) {
  const style = TONE_STYLES[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap"
      style={{ background: style.bg, color: style.fg }}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: style.dot }} />}
      {children}
    </span>
  );
}

export function OnlineDot({ online }: { online: boolean }) {
  return (
    <span
      className="h-2.5 w-2.5 rounded-full border-2"
      style={{
        background: online ? "var(--status-good)" : "var(--ink-muted)",
        borderColor: "var(--surface-1)",
      }}
      aria-label={online ? "Online" : "Offline"}
    />
  );
}
