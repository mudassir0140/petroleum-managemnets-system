interface ChartTableProps {
  caption: string;
  columns: string[];
  rows: (string | number)[][];
}

// Every chart ships a plain-table fallback: same values, no hover required.
export function ChartTable({ caption, columns, rows }: ChartTableProps) {
  return (
    <details className="mt-2 group">
      <summary className="cursor-pointer select-none text-xs font-medium text-ink-muted hover:text-ink-secondary transition-colors list-none flex items-center gap-1">
        <span className="inline-block transition-transform group-open:rotate-90">▸</span>
        View as table
      </summary>
      <div className="mt-2 overflow-x-auto rounded-lg border border-border-subtle">
        <table className="w-full text-xs">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="bg-surface-3">
              {columns.map((col) => (
                <th key={col} className="px-3 py-2 text-left font-medium text-ink-secondary whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-border-subtle">
                {row.map((cell, j) => (
                  <td key={j} className="px-3 py-2 text-ink-primary tabular-nums whitespace-nowrap">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
