"use client";

import { useRef, useState } from "react";
import { ChartLegend } from "./ChartLegend";
import { ChartTable } from "./ChartTable";
import { CHART_FORMATTERS, type ChartFormat } from "./formatters";

interface Series {
  name: string;
  color: string;
  data: number[];
  area?: boolean;
}

interface LineAreaChartProps {
  labels: string[];
  series: Series[];
  format?: ChartFormat;
  height?: number;
  tableCaption: string;
}

const VIEW_W = 720;
const PAD_L = 44;
const PAD_R = 12;
const PAD_T = 12;
const PAD_B = 26;

function niceMax(value: number): number {
  if (value <= 0) return 10;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

export function LineAreaChart({ labels, series, format = "number", height = 240, tableCaption }: LineAreaChartProps) {
  const valueFormatter = CHART_FORMATTERS[format];
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [pointerPx, setPointerPx] = useState<{ x: number; y: number } | null>(null);

  const plotW = VIEW_W - PAD_L - PAD_R;
  const plotH = height - PAD_T - PAD_B;
  const max = niceMax(Math.max(1, ...series.flatMap((s) => s.data)));
  const n = labels.length;
  const stepX = n > 1 ? plotW / (n - 1) : 0;

  const xAt = (i: number) => PAD_L + i * stepX;
  const yAt = (v: number) => PAD_T + plotH - (v / max) * plotH;

  const gridSteps = [0, 0.25, 0.5, 0.75, 1];

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scale = VIEW_W / rect.width;
    const localX = (e.clientX - rect.left) * scale;
    const idx = Math.round((localX - PAD_L) / (stepX || 1));
    const clamped = Math.min(n - 1, Math.max(0, idx));
    setHoverIndex(clamped);
    setPointerPx({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <div>
      {series.length >= 2 && (
        <div className="mb-2">
          <ChartLegend items={series.map((s) => ({ name: s.name, color: s.color, shape: "line" }))} />
        </div>
      )}
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEW_W} ${height}`}
          width="100%"
          height={height}
          className="block touch-none"
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoverIndex(null)}
          role="img"
          aria-label={tableCaption}
        >
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

          {series.map((s) => {
            if (!s.area) return null;
            const top = s.data.map((v, i) => `${i === 0 ? "M" : "L"}${xAt(i)},${yAt(v)}`).join(" ");
            const path = `${top} L${xAt(n - 1)},${yAt(0)} L${xAt(0)},${yAt(0)} Z`;
            return <path key={`area-${s.name}`} d={path} fill={s.color} opacity={0.1} stroke="none" />;
          })}

          {series.map((s) => (
            <path
              key={s.name}
              d={s.data.map((v, i) => `${i === 0 ? "M" : "L"}${xAt(i)},${yAt(v)}`).join(" ")}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {hoverIndex !== null && (
            <line
              x1={xAt(hoverIndex)}
              x2={xAt(hoverIndex)}
              y1={PAD_T}
              y2={PAD_T + plotH}
              stroke="var(--baseline)"
              strokeWidth={1}
            />
          )}

          {series.map((s) =>
            s.data.map((v, i) => {
              const isEnd = i === n - 1;
              const isHovered = hoverIndex === i;
              if (!isEnd && !isHovered) return null;
              return (
                <circle
                  key={`${s.name}-${i}`}
                  cx={xAt(i)}
                  cy={yAt(v)}
                  r={4}
                  fill={s.color}
                  stroke="var(--surface-1)"
                  strokeWidth={2}
                />
              );
            }),
          )}

          {labels.map((label, i) => {
            const showEvery = Math.max(1, Math.ceil(n / 7));
            if (i % showEvery !== 0 && i !== n - 1) return null;
            return (
              <text key={label + i} x={xAt(i)} y={height - 6} textAnchor="middle" fontSize={10} fill="var(--ink-muted)">
                {label}
              </text>
            );
          })}
        </svg>

        {hoverIndex !== null && pointerPx && (
          <div
            className="pointer-events-none absolute z-10 min-w-[9rem] rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 shadow-lg text-xs"
            style={{
              left: Math.min(Math.max(pointerPx.x + 12, 0), 560),
              top: Math.max(pointerPx.y - 16, 0),
            }}
          >
            <div className="mb-1 font-medium text-ink-secondary">{labels[hoverIndex]}</div>
            {series.map((s) => (
              <div key={s.name} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-ink-secondary">
                  <span className="inline-block h-0.5 w-3 rounded-full" style={{ background: s.color }} />
                  {s.name}
                </span>
                <span className="font-semibold tabular-nums text-ink-primary">{valueFormatter(s.data[hoverIndex])}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <ChartTable
        caption={tableCaption}
        columns={["Date", ...series.map((s) => s.name)]}
        rows={labels.map((label, i) => [label, ...series.map((s) => valueFormatter(s.data[i]))])}
      />
    </div>
  );
}
