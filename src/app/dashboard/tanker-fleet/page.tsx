// @ts-nocheck
"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { DetailChain, DetailRow, Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { TruckIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import { TANKERS, type Tanker } from "@/lib/dashboard/data/tankers";
import { FUEL_TYPE_LABELS, FUEL_TYPES } from "@/lib/dashboard/data/stations";

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
  outbound: { line: "#34d399", glow: "#34d399", label: "Company → Pump (Delivery)" },
  return: { line: "#fb923c", glow: "#fb923c", label: "Pump → Company (Return)" },
  idle: { line: "#64748b", glow: "#64748b", label: "At Depot" },
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

export default function TankerFleetPage() {
  const [tankers, setTankers] = useState<Tanker[]>(TANKERS);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [fuelType, setFuelType] = useState("All");
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
    tanker.driverLicense.toLowerCase().includes(searchLower) ||
    tanker.driver.toLowerCase().includes(searchLower);

  const filtered = useMemo(() => {
    return tankers.filter((tanker) => {
      const matchesStatus = status === "All" || tanker.status === status;
      const matchesFuel = fuelType === "All" || FUEL_TYPE_LABELS[tanker.fuelType] === fuelType;
      return matchesSearchTerm(tanker) && matchesStatus && matchesFuel;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tankers, search, status, fuelType]);

  const inTransit = tankers.filter((t) => t.direction === "outbound" && t.status !== "At Pump").length;
  const returning = tankers.filter((t) => t.direction === "return").length;
  const atDepot = tankers.filter((t) => t.status === "At Depot").length;
  const totalCapacity = tankers.reduce((sum, t) => sum + t.capacity, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tanker Fleet & Live Tracking"
        description="Live GPS routes from the Central Depot to every PSO pump — search by tanker number or driver licence."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Fleet size" value={String(tankers.length)} icon={TruckIcon} hint={`${(totalCapacity / 1000).toFixed(0)}K L combined capacity`} />
        <StatCard label="Delivering (outbound)" value={String(inTransit)} trend="up" delta="Live" />
        <StatCard label="Returning to depot" value={String(returning)} />
        <StatCard label="At depot" value={String(atDepot)} />
      </div>

      <SectionCard title="Live GPS map" description="Depot → pump delivery routes across the network — zoom, pan or click a tanker">
        <div className="relative m-5 h-[32rem] overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
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
      </SectionCard>

      <SectionCard
        title="All tankers"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("tanker-fleet", filtered.map((t) => ({
                ID: t.id,
                Driver: t.driver,
                "Driver Licence": t.driverLicense,
                "Fuel Type": FUEL_TYPE_LABELS[t.fuelType],
                "Capacity (L)": t.capacity,
                Status: t.status,
                Direction: t.direction,
                From: t.from,
                To: t.to,
                "Departure": t.departureTime,
                "Expected Arrival": t.expectedArrival,
                Location: t.location,
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search tanker number or driver licence…" />
          <FilterSelect value={status} onChange={setStatus} options={STATUSES} label="Status" />
          <FilterSelect
            value={fuelType}
            onChange={setFuelType}
            options={FUEL_TYPES.map((f) => FUEL_TYPE_LABELS[f])}
            label="Fuel"
          />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Tanker</th>
                <th className="px-5 py-3 font-medium">Driver / Licence</th>
                <th className="px-5 py-3 font-medium">Route</th>
                <th className="px-5 py-3 font-medium">Direction</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Expected arrival</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((tanker) => (
                <tr
                  key={tanker.id}
                  onClick={() => setSelectedId(tanker.id)}
                  className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                    tanker.id === selectedId ? "bg-amber-50/70 dark:bg-amber-500/5" : ""
                  }`}
                >
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{tanker.id}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    <p>{tanker.driver}</p>
                    <p className="text-xs text-slate-400">{tanker.driverLicense}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {tanker.from} → {tanker.to}
                  </td>
                  <td className="px-5 py-3">
                    <DirectionTag direction={tanker.direction} />
                  </td>
                  <td className="px-5 py-3">
                    <Badge>{tanker.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{tanker.expectedArrival}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No tankers match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {filtered.length} of {tankers.length} tankers · click a row or a marker on the map for full details
        </p>
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
          <DetailRow label="Driver licence no." value={selected.driverLicense} />
          <DetailRow label="Driver phone" value={selected.driverPhone} />
          <DetailRow label="Capacity" value={`${selected.capacity.toLocaleString()} L`} />
          <DetailRow label="Fuel type" value={FUEL_TYPE_LABELS[selected.fuelType]} />
          <DetailRow label="Starting point" value={selected.route[0]?.label} />
          <DetailRow label="Destination" value={selected.route[selected.route.length - 1]?.label} />
          <DetailRow label="Departure" value={selected.departureTime} />
          <DetailRow label="Expected arrival" value={selected.expectedArrival} />
          {selected.direction !== "idle" && <DetailRow label="Progress" value={`${selected.progress}%`} />}
          <DetailRow label="Current location" value={selected.location} />
        </Modal>
      )}
    </div>
  );
}
