"use client";

import { useState } from "react";
import { ChartLegend } from "./ChartLegend";
import { ChartTable } from "./ChartTable";
import { CHART_FORMATTERS, type ChartFormat } from "./formatters";

interface Series {
  name: string;
  color: string;
  data: number[];
}

interface BarChartProps {
  labels: string[];
  series: Series[];
  format?: ChartFormat;
  height?: number;
  tableCaption: string;
}

const VIEW_W = 720;
const PAD_L = 44;
const PAD_R = 12;
const PAD_T = 16;
const PAD_B = 26;
const MAX_BAR_THICKNESS = 24;

function niceMax(value: number): number {
  if (value <= 0) return 10;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

export function BarChart({ labels, series, format = "number", height = 240, tableCaption }: BarChartProps) {
  const valueFormatter = CHART_FORMATTERS[format];
  const [hovered, setHovered] = useState<{ cat: number; s: number } | null>(null);

  const plotW = VIEW_W - PAD_L - PAD_R;
  const plotH = height - PAD_T - PAD_B;
  const max = niceMax(Math.max(1, ...series.flatMap((s) => s.data)));
  const n = labels.length;
  const bandW = plotW / n;
  const gap = 3;
  const rawThickness = (bandW - gap * (series.length + 1)) / series.length;
  const thickness = Math.min(MAX_BAR_THICKNESS, Math.max(4, rawThickness));
  const groupW = thickness * series.length + gap * (series.length - 1);

  const yAt = (v: number) => PAD_T + plotH - (v / max) * plotH;
  const gridSteps = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div>
      {series.length >= 2 && (
        <div className="mb-2">
          <ChartLegend items={series.map((s) => ({ name: s.name, color: s.color, shape: "rect" }))} />
        </div>
      )}
      <div className="relative">
        <svg viewBox={`0 0 ${VIEW_W} ${height}`} width="100%" height={height} className="block" role="img" aria-label={tableCaption}>
          {gridSteps.map((g) => {
            const y = PAD_T + plotH - g * plotH;
            return (
              <g key={g}>
                <line x1={PAD_L} x2={VIEW_W - PAD_R} y1={y} y2={y} stroke="var(--gridline)" strokeWidth={1} />
                <text x={PAD_L - 8} y={y} textAnchor="end" dominantBaseline="middle" fontSize={10} fill="var(--ink-muted)">
                  {valueFormatter(Math.round(max * g))}
                </text>
              </g>
            );
          })}
          <line x1={PAD_L} x2={VIEW_W - PAD_R} y1={PAD_T + plotH} y2={PAD_T + plotH} stroke="var(--baseline)" strokeWidth={1} />

          {labels.map((label, catIndex) => {
            const bandCenter = PAD_L + bandW * catIndex + bandW / 2;
            const groupStart = bandCenter - groupW / 2;
            return (
              <g key={label}>
                {series.map((s, si) => {
                  const v = s.data[catIndex];
                  const barX = groupStart + si * (thickness + gap);
                  const barY = yAt(v);
                  const barH = PAD_T + plotH - barY;
                  const isHot = hovered?.cat === catIndex && hovered.s === si;
                  return (
                    <rect
                      key={s.name}
                      x={barX}
                      y={barH === 0 ? barY - 0.001 : barY}
                      width={thickness}
                      height={Math.max(barH, 1)}
                      rx={4}
                      fill={s.color}
                      opacity={isHot ? 0.85 : 1}
                      onPointerEnter={() => setHovered({ cat: catIndex, s: si })}
                      onPointerLeave={() => setHovered(null)}
                    >
                      <title>{`${label} · ${s.name}: ${valueFormatter(v)}`}</title>
                    </rect>
                  );
                })}
                <text x={bandCenter} y={height - 6} textAnchor="middle" fontSize={10} fill="var(--ink-muted)">
                  {label}
                </text>
              </g>
            );
          })}
        </svg>

        {hovered && (
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-xs shadow-lg">
            <div className="mb-0.5 font-medium text-ink-secondary">{labels[hovered.cat]}</div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ background: series[hovered.s].color }} />
              <span className="text-ink-secondary">{series[hovered.s].name}</span>
              <span className="font-semibold tabular-nums text-ink-primary">
                {valueFormatter(series[hovered.s].data[hovered.cat])}
              </span>
            </div>
          </div>
        )}
      </div>

      <ChartTable
        caption={tableCaption}
        columns={["Category", ...series.map((s) => s.name)]}
        rows={labels.map((label, i) => [label, ...series.map((s) => valueFormatter(s.data[i]))])}
      />
    </div>
  );
}
