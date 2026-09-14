import type { ReactNode } from "react";

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}

export function Table<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = "No records found.",
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-ink-muted">{emptyMessage}</p>;
  }

  const alignClass = (align?: "left" | "right" | "center") =>
    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-subtle">
            {columns.map((col) => (
              <th
                key={col.header}
                className={`whitespace-nowrap px-3 py-2.5 text-xs font-medium text-ink-muted ${alignClass(col.align)}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-border-subtle last:border-0 hover:bg-surface-2/60">
              {columns.map((col) => (
                <td key={col.header} className={`px-3 py-3 text-ink-primary ${alignClass(col.align)} ${col.className ?? ""}`}>
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
