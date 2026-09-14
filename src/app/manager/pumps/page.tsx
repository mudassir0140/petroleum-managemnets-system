"use client";

import { useMemo, useState } from "react";
import { MapPinIcon, PhoneIcon, UsersIcon } from "@/components/icons";
import { PumpStatusBadge } from "@/components/ops/badge";
import { FilterBar } from "@/components/ops/filter-controls";
import { DetailRow, Modal } from "@/components/ops/modal";
import { PageHeader } from "@/components/ops/page-header";
import { SectionCard } from "@/components/ops/section-card";
import { StatCard } from "@/components/ops/stat-card";
import { employeeById } from "@/lib/data/employees";
import { pumpStockPercent, PUMPS } from "@/lib/data/pumps";
import { formatCurrency, formatLiters } from "@/lib/format";
import type { Pump, PumpStatus } from "@/lib/manager/types";
import { TankIcon } from "@/components/icons";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "low-stock", label: "Low Stock" },
  { value: "closed", label: "Closed" },
];

function stockBarColor(percent: number) {
  if (percent <= 20) return "bg-rose-500";
  if (percent <= 45) return "bg-amber-500";
  return "bg-emerald-500";
}

export default function PumpOperationsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedPump, setSelectedPump] = useState<Pump | null>(null);

  const filtered = useMemo(() => {
    return PUMPS.filter((pump) => {
      const matchesStatus = status === "all" || pump.status === status;
      const matchesSearch =
        !search ||
        pump.name.toLowerCase().includes(search.toLowerCase()) ||
        pump.code.toLowerCase().includes(search.toLowerCase()) ||
        pump.city.toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [search, status]);

  const counts: Record<PumpStatus, number> = {
    open: PUMPS.filter((p) => p.status === "open").length,
    "low-stock": PUMPS.filter((p) => p.status === "low-stock").length,
    closed: PUMPS.filter((p) => p.status === "closed").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pump Operations"
        description="All pumps in the network, live status, stock levels and staff on duty."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Open pumps" value={String(counts.open)} icon={TankIcon} tone="emerald" />
        <StatCard
          label="Low stock pumps"
          value={String(counts["low-stock"])}
          icon={TankIcon}
          tone="amber"
        />
        <StatCard label="Closed pumps" value={String(counts.closed)} icon={TankIcon} tone="rose" />
      </div>

      <SectionCard noPadding>
        <div className="border-b border-slate-100 p-5 dark:border-slate-800">
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search pump, code or city..."
            filters={[
              {
                key: "status",
                label: "Filter by status",
                value: status,
                options: STATUS_OPTIONS,
                onChange: setStatus,
              },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((pump) => {
            const overallStock = pumpStockPercent(pump);
            return (
              <div
                key={pump.id}
                className="flex flex-col rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {pump.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{pump.code}</p>
                  </div>
                  <PumpStatusBadge status={pump.status} />
                </div>

                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <MapPinIcon className="size-3.5 shrink-0" />
                  {pump.address}, {pump.city}
                </p>

                <div className="mt-3 space-y-2">
                  {pump.stocks.map((stock) => {
                    const percent = Math.round((stock.stockLiters / stock.capacityLiters) * 100);
                    return (
                      <div key={stock.fuel}>
                        <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span>{stock.label}</span>
                          <span>{percent}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className={`h-full rounded-full ${stockBarColor(percent)}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <UsersIcon className="size-3.5 shrink-0" />
                  {pump.staffOnDuty.length > 0
                    ? pump.staffOnDuty
                        .map((id) => employeeById(id)?.name)
                        .filter(Boolean)
                        .join(", ")
                    : "No staff on duty"}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(pump.todaySalesValue)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatLiters(pump.todaySalesLiters)} today · {overallStock}% stocked
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPump(pump)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    View details
                  </button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-full py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              No pumps match your filters.
            </p>
          )}
        </div>
      </SectionCard>

      <Modal
        open={selectedPump !== null}
        onClose={() => setSelectedPump(null)}
        title={selectedPump?.name ?? ""}
        description={selectedPump ? `${selectedPump.code} · ${selectedPump.city}` : undefined}
      >
        {selectedPump && (
          <div className="space-y-4">
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Pump owner
              </p>
              <DetailRow label="Name" value={selectedPump.ownerName} />
              <DetailRow
                label="Phone"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <PhoneIcon className="size-3.5" />
                    {selectedPump.ownerPhone}
                  </span>
                }
              />
              <DetailRow label="Address" value={selectedPump.address} />
            </div>

            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Stock levels
              </p>
              {selectedPump.stocks.map((stock) => (
                <DetailRow
                  key={stock.fuel}
                  label={stock.label}
                  value={`${formatLiters(stock.stockLiters)} / ${formatLiters(stock.capacityLiters)}`}
                />
              ))}
            </div>

            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Today
              </p>
              <DetailRow label="Sales value" value={formatCurrency(selectedPump.todaySalesValue)} />
              <DetailRow label="Volume sold" value={formatLiters(selectedPump.todaySalesLiters)} />
              <DetailRow label="Last delivery" value={selectedPump.lastDelivery} />
              <DetailRow
                label="Staff on duty"
                value={
                  selectedPump.staffOnDuty.length > 0
                    ? selectedPump.staffOnDuty.map((id) => employeeById(id)?.name).join(", ")
                    : "None"
                }
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
