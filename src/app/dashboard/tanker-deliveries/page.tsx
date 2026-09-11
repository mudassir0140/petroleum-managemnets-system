"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { DetailChain, DetailRow, Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { ClipboardIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import { DELIVERIES, type Delivery } from "@/lib/dashboard/data/deliveries";
import { TANKERS } from "@/lib/dashboard/data/tankers";
import { FUEL_TYPE_LABELS } from "@/lib/dashboard/data/stations";

const STATUSES = ["Delivered", "In Transit", "Delayed", "Cancelled"];
const PUMPS = Array.from(new Set(DELIVERIES.map((d) => d.pump)));
const TANKER_IDS = Array.from(new Set(DELIVERIES.map((d) => d.tanker)));

export default function TankerDeliveriesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [pump, setPump] = useState("All");
  const [tanker, setTanker] = useState("All");
  const [selected, setSelected] = useState<Delivery | null>(null);

  const filtered = useMemo(() => {
    return DELIVERIES.filter((d) => {
      const matchesSearch =
        d.id.toLowerCase().includes(search.toLowerCase()) ||
        d.tanker.toLowerCase().includes(search.toLowerCase()) ||
        d.pump.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === "All" || d.status === status;
      const matchesPump = pump === "All" || d.pump === pump;
      const matchesTanker = tanker === "All" || d.tanker === tanker;
      return matchesSearch && matchesStatus && matchesPump && matchesTanker;
    });
  }, [search, status, pump, tanker]);

  const delivered = DELIVERIES.filter((d) => d.status === "Delivered");
  const delayedOrCancelled = DELIVERIES.filter((d) => d.status === "Delayed" || d.status === "Cancelled").length;
  const avgDiscrepancy =
    delivered.reduce((sum, d) => sum + (d.unloadedLiters - d.orderedLiters), 0) / (delivered.length || 1);

  const selectedTankerInfo = selected ? TANKERS.find((t) => t.id === selected.tanker) : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tanker Delivery Logs"
        description="Complete trip records — departure, route, arrival and litres delivered."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total deliveries logged" value={String(DELIVERIES.length)} icon={ClipboardIcon} />
        <StatCard label="Delivered" value={String(delivered.length)} trend="up" delta="On record" />
        <StatCard label="Delayed / cancelled" value={String(delayedOrCancelled)} trend="down" delta="Needs review" />
        <StatCard
          label="Avg. discrepancy"
          value={`${avgDiscrepancy >= 0 ? "+" : ""}${Math.round(avgDiscrepancy)} L`}
          hint="unloaded vs. ordered"
        />
      </div>

      <SectionCard
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("tanker-deliveries", filtered.map((d) => ({
                ID: d.id,
                Tanker: d.tanker,
                Driver: d.driver,
                Pump: d.pump,
                "Fuel Type": FUEL_TYPE_LABELS[d.fuelType],
                "Ordered (L)": d.orderedLiters,
                "Unloaded (L)": d.unloadedLiters,
                "Departed Depot": d.departedDepot,
                "Arrived Pump": d.arrivedPump ?? "—",
                Date: d.date,
                Status: d.status,
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search delivery ID, tanker or pump…" />
          <FilterSelect value={pump} onChange={setPump} options={PUMPS} label="Pump" />
          <FilterSelect value={tanker} onChange={setTanker} options={TANKER_IDS} label="Tanker" />
          <FilterSelect value={status} onChange={setStatus} options={STATUSES} label="Status" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Delivery</th>
                <th className="px-5 py-3 font-medium">Route</th>
                <th className="px-5 py-3 font-medium">Ordered</th>
                <th className="px-5 py-3 font-medium">Unloaded</th>
                <th className="px-5 py-3 font-medium">Discrepancy</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Departed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((d) => {
                const discrepancy = d.unloadedLiters - d.orderedLiters;
                return (
                  <tr
                    key={d.id}
                    onClick={() => setSelected(d)}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">{d.id}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{d.tanker} · {d.driver}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">Depot → {d.pump}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{d.orderedLiters.toLocaleString()} L</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {d.status === "Delivered" ? `${d.unloadedLiters.toLocaleString()} L` : "—"}
                    </td>
                    <td className="px-5 py-3">
                      {d.status === "Delivered" ? (
                        <span
                          className={
                            discrepancy < 0
                              ? "font-medium text-rose-600 dark:text-rose-400"
                              : discrepancy > 0
                                ? "font-medium text-emerald-600 dark:text-emerald-400"
                                : "text-slate-500"
                          }
                        >
                          {discrepancy > 0 ? "+" : ""}
                          {discrepancy.toLocaleString()} L
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Badge>{d.status}</Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{d.date} · {d.departedDepot}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No deliveries match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {filtered.length} of {DELIVERIES.length} deliveries · click a row for full details
        </p>
      </SectionCard>

      {selected && (
        <Modal
          title={`Tanker ${selected.tanker}`}
          subtitle={`Delivery ${selected.id} — ${selected.date}`}
          onClose={() => setSelected(null)}
        >
          <div className="mb-4">
            <DetailChain steps={[selected.depot, "Departed", selected.pump, "Unloaded"]} />
          </div>
          {selectedTankerInfo && <DetailRow label="Capacity" value={`${selectedTankerInfo.capacity.toLocaleString()} Litres`} />}
          <DetailRow label="Driver" value={selected.driver} />
          <DetailRow label="Departed Depot" value={selected.departedDepot} />
          <DetailRow label="Route" value={selected.route} />
          <DetailRow label="Arrived Pump" value={selected.arrivedPump ?? "Not yet arrived"} />
          <DetailRow label="Pump" value={selected.pump} />
          <DetailRow label="Litres Delivered" value={selected.status === "Delivered" ? `${selected.unloadedLiters.toLocaleString()} Litres` : "—"} />
          <DetailRow label="Ordered" value={`${selected.orderedLiters.toLocaleString()} Litres`} />
          <DetailRow label="Status" value={<Badge>{selected.status}</Badge>} />
        </Modal>
      )}
    </div>
  );
}
