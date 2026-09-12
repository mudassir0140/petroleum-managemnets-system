"use client";

import { useState } from "react";
import { ChartLegend } from "./ChartLegend";
import { ChartTable } from "./ChartTable";
import { CHART_FORMATTERS, type ChartFormat } from "./formatters";

interface Slice {
  name: string;
  color: string;
  value: number;
}

interface DonutChartProps {
  slices: Slice[];
  format?: ChartFormat;
  centerLabel?: string;
  size?: number;
  tableCaption: string;
}

export function DonutChart({ slices, format = "number", centerLabel, size = 176, tableCaption }: DonutChartProps) {
  const valueFormatter = CHART_FORMATTERS[format];
  const [hovered, setHovered] = useState<number | null>(null);
  const total = slices.reduce((sum, s) => sum + s.value, 0) || 1;
  const r = size / 2 - 14;
  const circumference = 2 * Math.PI * r;
  const gap = 3;

  const segments = slices.reduce<Array<Slice & { length: number; offset: number; index: number }>>((acc, s, i) => {
    const priorOffset = acc.length > 0 ? acc[acc.length - 1].offset + (acc[acc.length - 1].value / total) * circumference : 0;
    const length = Math.max((s.value / total) * circumference - gap, 0);
    acc.push({ ...s, length, offset: priorOffset, index: i });
    return acc;
  }, []);

  const activeSlice = hovered !== null ? slices[hovered] : null;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={tableCaption}>
          <g transform={`translate(${size / 2},${size / 2}) rotate(-90)`}>
            <circle r={r} fill="none" stroke="var(--surface-3)" strokeWidth={20} />
            {segments.map((seg) => (
              <circle
                key={seg.name}
                r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth={20}
                strokeDasharray={`${seg.length} ${circumference - seg.length}`}
                strokeDashoffset={-seg.offset}
                strokeLinecap="butt"
                opacity={hovered === null || hovered === seg.index ? 1 : 0.35}
                onPointerEnter={() => setHovered(seg.index)}
                onPointerLeave={() => setHovered(null)}
                style={{ cursor: "pointer" }}
              >
                <title>{`${seg.name}: ${valueFormatter(seg.value)} (${Math.round((seg.value / total) * 100)}%)`}</title>
              </circle>
            ))}
          </g>
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {activeSlice ? (
            <>
              <span className="text-[11px] text-ink-muted">{activeSlice.name}</span>
              <span className="text-base font-semibold tabular-nums text-ink-primary">{valueFormatter(activeSlice.value)}</span>
              <span className="text-[11px] text-ink-secondary">{Math.round((activeSlice.value / total) * 100)}%</span>
            </>
          ) : (
            <>
              <span className="text-[11px] text-ink-muted">{centerLabel ?? "Total"}</span>
              <span className="text-base font-semibold tabular-nums text-ink-primary">{valueFormatter(total)}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        {slices.map((s, i) => (
          <button
            key={s.name}
            type="button"
            onPointerEnter={() => setHovered(i)}
            onPointerLeave={() => setHovered(null)}
            className="flex items-center justify-between gap-3 rounded-md px-1.5 py-1 text-left text-xs transition-colors hover:bg-surface-3"
          >
            <span className="flex items-center gap-1.5 text-ink-secondary">
              <span className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ background: s.color }} />
              {s.name}
            </span>
            <span className="font-semibold tabular-nums text-ink-primary">
              {valueFormatter(s.value)}
              <span className="ml-1 font-normal text-ink-muted">({Math.round((s.value / total) * 100)}%)</span>
            </span>
          </button>
        ))}
        <ChartTable
          caption={tableCaption}
          columns={["Category", "Value", "Share"]}
          rows={slices.map((s) => [s.name, valueFormatter(s.value), `${Math.round((s.value / total) * 100)}%`])}
        />
      </div>
    </div>
  );
}

export function DonutLegendOnly({ slices }: { slices: Slice[] }) {
  return <ChartLegend items={slices.map((s) => ({ name: s.name, color: s.color, shape: "rect" }))} />;
}
