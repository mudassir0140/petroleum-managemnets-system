interface LegendItem {
  name: string;
  color: string;
  shape?: "line" | "rect";
}

export function ChartLegend({ items }: { items: LegendItem[] }) {
  if (items.length < 2) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-secondary">
      {items.map((item) => (
        <span key={item.name} className="inline-flex items-center gap-1.5">
          {item.shape === "rect" ? (
            <span className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ background: item.color }} />
          ) : (
            <span className="inline-block h-0.5 w-3 rounded-full" style={{ background: item.color }} />
          )}
          {item.name}
        </span>
      ))}
    </div>
  );
}
