"use client";

import { useMemo, useState } from "react";
import { Table, type Column } from "@/components/ui/Table";
import { Select } from "@/components/ui/SearchInput";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import { IconFilter } from "@/components/icons";
import { formatDate, formatLitres, titleCase } from "@/lib/format";
import type { StockHistoryEntry } from "@/lib/types";

const TYPE_TONE = {
  received: "good",
  sold: "brand",
  adjustment: "warning",
} as const;

export function StockHistoryTable({ entries }: { entries: StockHistoryEntry[] }) {
  const [fuel, setFuel] = useState("all");
  const [type, setType] = useState("all");

  const filtered = useMemo(
    () =>
      entries.filter((e) => (fuel === "all" || e.fuel === fuel) && (type === "all" || e.type === type)),
    [entries, fuel, type],
  );

  const columns: Column<StockHistoryEntry>[] = [
    { header: "Date", cell: (row) => formatDate(row.date) },
    { header: "Fuel", cell: (row) => titleCase(row.fuel) },
    { header: "Type", cell: (row) => <Badge tone={TYPE_TONE[row.type]}>{titleCase(row.type)}</Badge> },
    {
      header: "Litres",
      align: "right",
      cell: (row) => (
        <span className={row.type === "received" ? "text-[color:var(--status-good-text)]" : row.litres < 0 ? "text-[color:var(--status-critical)]" : ""}>
          {row.type === "received" ? "+" : row.type === "adjustment" && row.litres >= 0 ? "+" : ""}
          {formatLitres(row.litres)}
        </span>
      ),
    },
    { header: "Note", cell: (row) => <span className="text-ink-muted">{row.note}</span> },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">
          <IconFilter size={14} /> Filter
        </span>
        <Select
          value={fuel}
          onChange={setFuel}
          options={[
            { label: "All fuels", value: "all" },
            { label: "Petrol", value: "petrol" },
            { label: "Diesel", value: "diesel" },
          ]}
        />
        <Select
          value={type}
          onChange={setType}
          options={[
            { label: "All types", value: "all" },
            { label: "Received", value: "received" },
            { label: "Sold", value: "sold" },
            { label: "Adjustment", value: "adjustment" },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No stock movements found" description="Try a different filter combination." />
      ) : (
        <Table columns={columns} rows={filtered} rowKey={(row) => row.id} />
      )}
    </div>
  );
}
