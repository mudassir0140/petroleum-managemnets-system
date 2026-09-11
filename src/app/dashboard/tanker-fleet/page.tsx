"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { DetailChain, DetailRow, Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { FactoryIcon, MapPinIcon, TruckIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import {
  currentPosition,
  NETWORK_NODES,
  projectGeo,
  TANKERS,
  type Tanker,
} from "@/lib/dashboard/data/tankers";
import { FUEL_TYPE_LABELS, FUEL_TYPES } from "@/lib/dashboard/data/stations";

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

      <SectionCard title="Live GPS map" description="Depot → pump delivery routes across the network">
        <div className="relative m-5 h-[26rem] overflow-hidden rounded-xl border border-slate-200 bg-slate-950 dark:border-slate-800">
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:32px_32px]"
          />

          {/* Route lines */}
          <svg
            aria-hidden
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 size-full"
          >
            {tankers
              .filter((t) => t.route.length > 1)
              .map((tanker) => {
                const style = DIRECTION_STYLES[tanker.direction];
                const isSelected = tanker.id === selectedId;
                const dimmed = searchLower !== "" && !matchesSearchTerm(tanker);
                const points = tanker.route
                  .map((p) => {
                    const { xPct, yPct } = projectGeo(p.lat, p.lng);
                    return `${xPct},${yPct}`;
                  })
                  .join(" ");
                return (
                  <polyline
                    key={tanker.id}
                    points={points}
                    fill="none"
                    stroke={style.line}
                    strokeWidth={isSelected ? 0.7 : 0.35}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={tanker.direction === "idle" ? undefined : "1.6 1.4"}
                    opacity={dimmed ? 0.15 : isSelected ? 1 : 0.55}
                    style={{
                      filter: isSelected ? `drop-shadow(0 0 2px ${style.glow})` : undefined,
                      transition: "opacity 300ms, stroke-width 300ms",
                    }}
                  />
                );
              })}
          </svg>

          {/* Route stop markers (intermediate waypoints only) */}
          {tankers.flatMap((tanker) =>
            tanker.route.slice(1, -1).map((stop, idx) => {
              const { xPct, yPct } = projectGeo(stop.lat, stop.lng);
              return (
                <div
                  key={`${tanker.id}-stop-${idx}`}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ top: `${yPct}%`, left: `${xPct}%` }}
                  title={stop.label}
                >
                  <span className="block size-1.5 rounded-full bg-slate-500" />
                </div>
              );
            }),
          )}

          {/* Depot + pump markers */}
          {NETWORK_NODES.map((node, idx) => {
            const { xPct, yPct } = projectGeo(node.lat, node.lng);
            const isDepot = idx === 0;
            return (
              <div
                key={node.label}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ top: `${yPct}%`, left: `${xPct}%` }}
                title={node.label}
              >
                <span
                  className={`flex size-5 items-center justify-center rounded-full border-2 border-slate-950 ${
                    isDepot ? "bg-amber-400 text-slate-950" : "bg-sky-400 text-slate-950"
                  }`}
                >
                  {isDepot ? <FactoryIcon className="size-3" /> : <MapPinIcon className="size-3" />}
                </span>
                <span className="mt-1 block max-w-[6.5rem] whitespace-nowrap text-[10px] font-medium text-slate-300">
                  {node.label}
                </span>
              </div>
            );
          })}

          {/* Live tanker markers */}
          {tankers.map((tanker) => {
            const pos = currentPosition(tanker);
            const { xPct, yPct } = projectGeo(pos.lat, pos.lng);
            const style = DIRECTION_STYLES[tanker.direction];
            const isSelected = tanker.id === selectedId;
            const dimmed = searchLower !== "" && !matchesSearchTerm(tanker);
            return (
              <button
                key={tanker.id}
                type="button"
                onClick={() => setSelectedId(tanker.id)}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-1000"
                style={{ top: `${yPct}%`, left: `${xPct}%`, opacity: dimmed ? 0.25 : 1 }}
                title={`${tanker.id} — ${tanker.driver} — ${tanker.status}`}
              >
                <span className="relative flex size-4 items-center justify-center">
                  {tanker.direction !== "idle" && tanker.status !== "At Pump" && (
                    <span
                      className="absolute inline-flex size-full animate-ping rounded-full opacity-50"
                      style={{ backgroundColor: style.glow }}
                    />
                  )}
                  <span
                    className={`relative flex size-4 items-center justify-center rounded-full border-2 border-slate-950 ${
                      isSelected ? "ring-2 ring-white/80" : ""
                    }`}
                    style={{ backgroundColor: style.glow }}
                  >
                    <TruckIcon className="size-2.5 text-slate-950" />
                  </span>
                </span>
              </button>
            );
          })}

          <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg bg-slate-900/85 px-3 py-2 text-[11px] font-medium text-slate-300">
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
