"use client";

import { useMemo, useState } from "react";
import { Table, type Column } from "@/components/ui/Table";
import { SearchInput, Select } from "@/components/ui/SearchInput";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import { IconPhone, IconTruck } from "@/components/icons";
import { formatDateTime, formatLitres, titleCase } from "@/lib/format";
import { TANKER_STATUS_LABEL, TANKER_STATUS_TONE } from "@/lib/status-maps";
import type { IncomingTanker, TankerStatus } from "@/lib/types";

const STATUS_OPTIONS: { label: string; value: "all" | TankerStatus }[] = [
  { label: "All statuses", value: "all" },
  { label: "Scheduled", value: "scheduled" },
  { label: "In transit", value: "in_transit" },
  { label: "Arriving soon", value: "arriving_soon" },
  { label: "Arrived", value: "arrived" },
  { label: "Delayed", value: "delayed" },
];

export function TankersBoard({ tankers }: { tankers: IncomingTanker[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | TankerStatus>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tankers
      .filter((t) => status === "all" || t.status === status)
      .filter((t) => !q || t.tankerNumber.toLowerCase().includes(q) || t.driverName.toLowerCase().includes(q))
      .sort((a, b) => new Date(a.expectedArrival).getTime() - new Date(b.expectedArrival).getTime());
  }, [tankers, query, status]);

  const columns: Column<IncomingTanker>[] = [
    {
      header: "Tanker",
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: row.fuel === "petrol" ? "var(--fuel-petrol-soft)" : "var(--fuel-diesel-soft)", color: row.fuel === "petrol" ? "var(--fuel-petrol)" : "var(--fuel-diesel)" }}
          >
            <IconTruck size={16} />
          </div>
          <div>
            <p className="font-medium">{row.tankerNumber}</p>
            <p className="text-xs text-ink-muted">{row.supplier}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Driver",
      cell: (row) => (
        <div>
          <p>{row.driverName}</p>
          <p className="flex items-center gap-1 text-xs text-ink-muted">
            <IconPhone size={12} /> {row.driverPhone}
          </p>
        </div>
      ),
    },
    { header: "Fuel", cell: (row) => titleCase(row.fuel) },
    { header: "Expected litres", align: "right", cell: (row) => formatLitres(row.expectedLitres) },
    { header: "Expected arrival", cell: (row) => formatDateTime(row.expectedArrival) },
    { header: "Status", cell: (row) => <Badge tone={TANKER_STATUS_TONE[row.status]}>{TANKER_STATUS_LABEL[row.status]}</Badge> },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={query} onChange={setQuery} placeholder="Search by tanker number or driver…" className="sm:max-w-xs" />
        <Select value={status} onChange={(v) => setStatus(v as "all" | TankerStatus)} options={STATUS_OPTIONS} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No tankers match your filters" description="Try clearing the search or status filter." />
      ) : (
        <Table columns={columns} rows={filtered} rowKey={(row) => row.id} />
      )}
    </div>
  );
}
