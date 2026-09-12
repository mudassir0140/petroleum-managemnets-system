interface SparklineProps {
  data: number[];
  accent: string;
  width?: number;
  height?: number;
}

export function Sparkline({ data, accent, width = 96, height = 28 }: SparklineProps) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const stepX = width / (data.length - 1);

  const points = data.map((v, i) => ({
    x: i * stepX,
    y: height - ((v - min) / span) * (height - 4) - 2,
  }));

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const last = points[points.length - 1];
  const secondLast = points[points.length - 2];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible" aria-hidden="true">
      <path d={path} fill="none" stroke="var(--ink-muted)" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" opacity={0.5} />
      <path
        d={`M${secondLast.x.toFixed(1)},${secondLast.y.toFixed(1)} L${last.x.toFixed(1)},${last.y.toFixed(1)}`}
        fill="none"
        stroke={accent}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <circle cx={last.x} cy={last.y} r={3} fill={accent} stroke="var(--surface-1)" strokeWidth={2} />
    </svg>
  );
}
