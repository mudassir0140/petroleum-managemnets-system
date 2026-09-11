"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { DetailRow, Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { TruckIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import { MAP_NODES, TANKERS, type Tanker } from "@/lib/dashboard/data/tankers";
import { FUEL_TYPE_LABELS, FUEL_TYPES } from "@/lib/dashboard/data/stations";

const STATUSES = ["At Depot", "In Transit", "At Pump", "Returning"];

function tick(tankers: Tanker[]): Tanker[] {
  return tankers.map((tanker) => {
    if (tanker.status !== "In Transit" || tanker.progress >= 97) return tanker;
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
  const [selected, setSelected] = useState<Tanker | null>(null);

  useEffect(() => {
    const id = setInterval(() => setTankers((prev) => tick(prev)), 4000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    return tankers.filter((tanker) => {
      const matchesSearch =
        tanker.driver.toLowerCase().includes(search.toLowerCase()) ||
        tanker.id.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === "All" || tanker.status === status;
      const matchesFuel = fuelType === "All" || tanker.fuelType === fuelType;
      return matchesSearch && matchesStatus && matchesFuel;
    });
  }, [tankers, search, status, fuelType]);

  const inTransit = tankers.filter((t) => t.status === "In Transit").length;
  const atDepot = tankers.filter((t) => t.status === "At Depot").length;
  const totalCapacity = tankers.reduce((sum, t) => sum + t.capacity, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tanker Fleet & Live Tracking"
        description="Live fleet positions, routes and delivery status."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Fleet size" value={String(tankers.length)} icon={TruckIcon} hint={`${(totalCapacity / 1000).toFixed(0)}K L combined capacity`} />
        <StatCard label="In transit" value={String(inTransit)} trend="up" delta="Live" />
        <StatCard label="At depot" value={String(atDepot)} />
        <StatCard label="At pump / returning" value={String(tankers.length - inTransit - atDepot)} />
      </div>

      <SectionCard title="Live GPS map" description="Approximate fleet positions across the network">
        <div className="relative m-5 h-80 overflow-hidden rounded-xl border border-slate-200 bg-slate-950 dark:border-slate-800">
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:32px_32px]"
          />
          {MAP_NODES.map((node) => (
            <div
              key={node.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ top: `${node.top}%`, left: `${node.left}%` }}
            >
              <div className={`size-2.5 rounded-full ${node.kind === "depot" ? "bg-amber-400" : "bg-sky-400"}`} />
              <span className="mt-1 block whitespace-nowrap text-[10px] font-medium text-slate-300">
                {node.label}
              </span>
            </div>
          ))}
          {tankers.map((tanker) => (
            <div
              key={tanker.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-1000"
              style={{ top: `${tanker.mapPosition.top}%`, left: `${tanker.mapPosition.left}%` }}
              title={`${tanker.id} — ${tanker.status}`}
              onClick={() => setSelected(tanker)}
            >
              <span className="relative flex size-3">
                {tanker.status === "In Transit" && (
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                )}
                <span
                  className={`relative inline-flex size-3 rounded-full border-2 border-slate-950 ${
                    tanker.status === "In Transit"
                      ? "bg-emerald-400"
                      : tanker.status === "At Pump"
                        ? "bg-sky-400"
                        : tanker.status === "Returning"
                          ? "bg-violet-400"
                          : "bg-slate-400"
                  }`}
                />
              </span>
            </div>
          ))}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-medium text-emerald-400">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
            Live — updates every few seconds
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
                "Fuel Type": FUEL_TYPE_LABELS[t.fuelType],
                "Capacity (L)": t.capacity,
                Status: t.status,
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
          <SearchInput value={search} onChange={setSearch} placeholder="Search tanker ID or driver…" />
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
                <th className="px-5 py-3 font-medium">Driver</th>
                <th className="px-5 py-3 font-medium">Route</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Departure</th>
                <th className="px-5 py-3 font-medium">Expected arrival</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered
                .filter((t) => fuelType === "All" || FUEL_TYPE_LABELS[t.fuelType] === fuelType)
                .map((tanker) => (
                <tr
                  key={tanker.id}
                  onClick={() => setSelected(tanker)}
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{tanker.id}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{tanker.driver}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {tanker.from} → {tanker.to}
                  </td>
                  <td className="px-5 py-3">
                    <Badge>{tanker.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{tanker.departureTime}</td>
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
          Showing {filtered.length} of {tankers.length} tankers · click a row for full details
        </p>
      </SectionCard>

      {selected && (
        <Modal title={selected.id} subtitle={`Driver: ${selected.driver}`} onClose={() => setSelected(null)}>
          <DetailRow label="Capacity" value={`${selected.capacity.toLocaleString()} L`} />
          <DetailRow label="Fuel type" value={FUEL_TYPE_LABELS[selected.fuelType]} />
          <DetailRow label="Driver phone" value={selected.driverPhone} />
          <DetailRow label="Status" value={<Badge>{selected.status}</Badge>} />
          <DetailRow label="Route" value={`${selected.from} → ${selected.to}`} />
          <DetailRow label="Departure" value={selected.departureTime} />
          <DetailRow label="Expected arrival" value={selected.expectedArrival} />
          {selected.status === "In Transit" && <DetailRow label="Progress" value={`${selected.progress}%`} />}
          <DetailRow label="Current location" value={selected.location} />
        </Modal>
      )}
    </div>
  );
}
