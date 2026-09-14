export function Meter({
  label,
  current,
  capacity,
  color,
  formatValue,
}: {
  label: string;
  current: number;
  capacity: number;
  color: string;
  formatValue: (v: number) => string;
}) {
  const pct = Math.min(100, Math.max(0, (current / capacity) * 100));
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-medium text-ink-secondary">{label}</span>
        <span className="text-ink-muted">
          <span className="font-semibold tabular-nums text-ink-primary">{formatValue(current)}</span> / {formatValue(capacity)}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ background: `color-mix(in srgb, ${color} 16%, var(--surface-3))` }}>
        <div className="h-full rounded-full transition-[width]" style={{ width: `${pct}%`, background: color }} />
      </div>
      <p className="mt-1 text-right text-[11px] text-ink-muted">{Math.round(pct)}% of capacity</p>
    </div>
  );
}
