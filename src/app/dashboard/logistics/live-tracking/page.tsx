// @ts-nocheck
"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { DetailChain, DetailRow, Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { GaugeIcon } from "@/components/icons";
import { TANKERS, type Tanker } from "@/lib/dashboard/data/tankers";
import { FUEL_TYPE_LABELS } from "@/lib/dashboard/data/stations";

const TankerLiveMap = dynamic(
  () => import("@/components/dashboard/tanker-live-map").then((m) => m.TankerLiveMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex size-full items-center justify-center text-sm text-slate-400">
        Loading live map…
      </div>
    ),
  },
);

const STATUSES = ["At Depot", "In Transit", "At Pump", "Returning"];

const DIRECTION_STYLES = {
  outbound: { label: "Company → Pump (Delivery)" },
  return: { label: "Pump → Company (Return)" },
  idle: { label: "At Depot" },
} as const;

function DirectionTag({ direction }: { direction: Tanker["direction"] }) {
  const classes =
    direction === "outbound"
      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      : direction === "return"
        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
        : "bg-slate-500/15 text-slate-500 dark:text-slate-400";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${classes}`}>
      <span
        className={`size-1.5 rounded-full ${
          direction === "outbound" ? "bg-emerald-500" : direction === "return" ? "bg-amber-500" : "bg-slate-400"
        }`}
      />
      {DIRECTION_STYLES[direction].label}
    </span>
  );
}

function tick(tankers: Tanker[]): Tanker[] {
  return tankers.map((tanker) => {
    if (tanker.direction === "idle" || tanker.progress >= 97) return tanker;
    const bump = 1 + Math.round(Math.random() * 3);
    const progress = Math.min(97, tanker.progress + bump);
    return { ...tanker, progress };
  });
}

export default function LogisticsLiveTrackingPage() {
  const [tankers, setTankers] = useState<Tanker[]>(TANKERS);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setTankers((prev) => tick(prev)), 4000);
    return () => clearInterval(id);
  }, []);

  const selected = tankers.find((t) => t.id === selectedId) ?? null;

  const searchLower = search.trim().toLowerCase();
  const matchesSearchTerm = (tanker: Tanker) =>
    !searchLower ||
    tanker.id.toLowerCase().includes(searchLower) ||
    tanker.driver.toLowerCase().includes(searchLower);

  const filtered = useMemo(() => {
    return tankers.filter((tanker) => {
      const matchesStatus = status === "All" || tanker.status === status;
      return matchesSearchTerm(tanker) && matchesStatus;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tankers, search, status]);

  const delivering = tankers.filter((t) => t.direction === "outbound" && t.status !== "At Pump").length;
  const returning = tankers.filter((t) => t.direction === "return").length;
  const atDepot = tankers.filter((t) => t.status === "At Depot").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Tracking"
        description="Real-time GPS positions for every tanker on the road — search, filter or click a marker."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Live now" value={String(delivering + returning)} icon={GaugeIcon} trend="up" delta="On the road" />
        <StatCard label="Delivering (outbound)" value={String(delivering)} />
        <StatCard label="Returning to depot" value={String(returning)} />
        <StatCard label="At depot" value={String(atDepot)} />
      </div>

      <SectionCard title="Live GPS map" description="Depot → pump delivery routes across the network — zoom, pan or click a tanker">
        <div className="p-5">
          <FilterBar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search tanker number or driver…" />
            <FilterSelect value={status} onChange={setStatus} options={STATUSES} label="Status" />
          </FilterBar>
          <div className="relative mt-4 h-[32rem] overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
            <TankerLiveMap
              tankers={tankers}
              selectedId={selectedId}
              onSelect={setSelectedId}
              isMatch={matchesSearchTerm}
              hasSearch={searchLower !== ""}
            />
            <div className="pointer-events-none absolute bottom-3 left-3 z-[500] flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg bg-slate-900/85 px-3 py-2 text-[11px] font-medium text-slate-300">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-400" /> Company → Pump
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="size-1.5 rounded-full bg-amber-400" /> Pump → Company
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" /> Live
              </span>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Live status" description="Click a tanker for full route and delivery details">
        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tanker) => (
            <button
              key={tanker.id}
              type="button"
              onClick={() => setSelectedId(tanker.id)}
              className={`rounded-xl border p-4 text-left transition ${
                tanker.id === selectedId
                  ? "border-amber-400 bg-amber-50/70 dark:border-amber-500 dark:bg-amber-500/5"
                  : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{tanker.id}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{tanker.driver}</p>
                </div>
                <Badge>{tanker.status}</Badge>
              </div>
              <div className="mt-3">
                <DirectionTag direction={tanker.direction} />
              </div>
              {tanker.direction !== "idle" && (
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: `${tanker.progress}%` }} />
                </div>
              )}
              <p className="mt-2 text-xs text-slate-400">{tanker.location}</p>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              No tankers match these filters.
            </p>
          )}
        </div>
      </SectionCard>

      {selected && (
        <Modal title={selected.id} subtitle={`Driver: ${selected.driver}`} onClose={() => setSelectedId(null)}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <DirectionTag direction={selected.direction} />
            <Badge>{selected.status}</Badge>
          </div>
          <div className="mb-4">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Complete route</p>
            <DetailChain steps={selected.route.map((p) => p.label)} />
          </div>
          <DetailRow label="Driver phone" value={selected.driverPhone} />
          <DetailRow label="Capacity" value={`${selected.capacity.toLocaleString()} L`} />
          <DetailRow label="Fuel type" value={FUEL_TYPE_LABELS[selected.fuelType]} />
          <DetailRow label="Departure" value={selected.departureTime} />
          <DetailRow label="Expected arrival" value={selected.expectedArrival} />
          {selected.direction !== "idle" && <DetailRow label="Progress" value={`${selected.progress}%`} />}
          <DetailRow label="Current location" value={selected.location} />
        </Modal>
      )}
    </div>
  );
}
