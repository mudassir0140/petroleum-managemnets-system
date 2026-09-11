"use client";

import { useEffect, useState } from "react";
import { FactoryIcon, MapPinIcon, SearchIcon, TruckIcon } from "@/components/icons";
import { TripStatusBadge } from "@/components/ops/badge";
import { formatLiters } from "@/lib/format";
import { isRouteAnimated, staticProgressFor, type MapPoint, type TankerRoute } from "@/lib/data/tanker-map";
import type { Driver, Tanker } from "@/lib/types";

function hashSeed(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) % 100;
  }
  return hash;
}

function seedFor(route: TankerRoute): number {
  return isRouteAnimated(route) ? hashSeed(route.key) : staticProgressFor(route.status);
}

function positionAlong(route: TankerRoute, progress: number) {
  const t = progress / 100;
  return {
    top: route.from.top + (route.to.top - route.from.top) * t,
    left: route.from.left + (route.to.left - route.from.left) * t,
  };
}

export function TankerFleetMap({
  points,
  routes,
  tankerById,
  driverById,
}: {
  points: MapPoint[];
  routes: TankerRoute[];
  tankerById: (id: string) => Tanker | null;
  driverById: (id: string) => Driver | null;
}) {
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const route of routes) initial[route.key] = seedFor(route);
    return initial;
  });

  useEffect(() => {
    const id = setInterval(() => {
      setProgress((prev) => {
        const next = { ...prev };
        let changed = false;
        for (const route of routes) {
          if (isRouteAnimated(route)) {
            next[route.key] = ((prev[route.key] ?? seedFor(route)) + 1.5) % 100;
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 200);
    return () => clearInterval(id);
  }, [routes]);

  const normalizedSearch = search.trim().toLowerCase();
  const matchesSearch = (route: TankerRoute) => {
    if (!normalizedSearch) return true;
    const tanker = tankerById(route.tankerId);
    const driver = driverById(route.driverId);
    return (
      Boolean(tanker?.regNumber.toLowerCase().includes(normalizedSearch)) ||
      Boolean(driver?.licenseNo.toLowerCase().includes(normalizedSearch))
    );
  };

  function handleSearchChange(value: string) {
    setSearch(value);
    const normalized = value.trim().toLowerCase();
    if (!normalized) return;
    const match = routes.find((route) => {
      const tanker = tankerById(route.tankerId);
      const driver = driverById(route.driverId);
      return (
        tanker?.regNumber.toLowerCase().includes(normalized) ||
        driver?.licenseNo.toLowerCase().includes(normalized)
      );
    });
    if (match) setSelectedKey(match.key);
  }

  const selected = routes.find((route) => route.key === selectedKey) ?? null;
  const selectedTanker = selected ? tankerById(selected.tankerId) : null;
  const selectedDriver = selected ? driverById(selected.driverId) : null;

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(event) => handleSearchChange(event.target.value)}
          placeholder="Search tanker number or driver licence…"
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="relative h-[420px] overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-sky-50 lg:col-span-2 dark:border-slate-800 dark:from-slate-950 dark:to-slate-900">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
            {routes.map((route) => {
              const dimmed = Boolean(normalizedSearch) && !matchesSearch(route);
              const color = route.direction === "delivery" ? "#10b981" : "#f97316";
              const dashed = route.status === "scheduled";
              return (
                <line
                  key={route.key}
                  x1={route.from.left}
                  y1={route.from.top}
                  x2={route.to.left}
                  y2={route.to.top}
                  stroke={color}
                  strokeWidth={selectedKey === route.key ? 2 : 1}
                  strokeDasharray={dashed ? "3 2" : undefined}
                  vectorEffect="non-scaling-stroke"
                  opacity={dimmed ? 0.15 : selectedKey === route.key ? 1 : 0.55}
                />
              );
            })}
          </svg>

          {points.map((point) => (
            <div
              key={point.id}
              title={point.name}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
              style={{ top: `${point.top}%`, left: `${point.left}%` }}
            >
              <span
                className={`flex size-6 items-center justify-center rounded-full border shadow-sm ${
                  point.kind === "depot"
                    ? "border-slate-300 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                    : "border-sky-200 bg-sky-50 text-sky-600 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-400"
                }`}
              >
                {point.kind === "depot" ? (
                  <FactoryIcon className="size-3.5" />
                ) : (
                  <MapPinIcon className="size-3.5" />
                )}
              </span>
              <span className="max-w-20 truncate rounded bg-white/80 px-1 text-[9px] font-medium text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
                {point.name}
              </span>
            </div>
          ))}

          {routes.map((route) => {
            const dimmed = Boolean(normalizedSearch) && !matchesSearch(route);
            const pos = positionAlong(route, progress[route.key] ?? seedFor(route));
            const tanker = tankerById(route.tankerId);
            const isSelected = selectedKey === route.key;
            return (
              <button
                key={route.key}
                type="button"
                onClick={() => setSelectedKey(route.key)}
                title={`${tanker?.regNumber ?? route.tankerId} — ${route.direction === "delivery" ? "Delivering" : "Returning"}`}
                className={`absolute flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border shadow transition ${
                  route.direction === "delivery"
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-orange-500 bg-orange-500 text-white"
                } ${dimmed ? "opacity-20" : "opacity-100"} ${isSelected ? "ring-2 ring-offset-1 ring-slate-900 dark:ring-white" : ""}`}
                style={{ top: `${pos.top}%`, left: `${pos.left}%` }}
              >
                <TruckIcon className="size-3.5" />
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-600 lg:flex-col lg:items-start lg:gap-2 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-emerald-500" />
              Delivery: Company → Pump
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-orange-500" />
              Return: Pump → Company
            </span>
          </div>

          <div className="flex-1 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            {selected && selectedTanker && selectedDriver ? (
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {selectedTanker.regNumber}
                  </p>
                  <TripStatusBadge status={selected.status} />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedDriver.name} · Licence {selectedDriver.licenseNo}
                </p>
                <div className="border-t border-slate-100 pt-2.5 text-xs dark:border-slate-800">
                  <p className="text-slate-500 dark:text-slate-400">
                    {selected.direction === "delivery" ? "Delivering to" : "Returning to"}
                  </p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {selected.from.name} → {selected.to.name}
                  </p>
                  {selected.stops.length > 0 && (
                    <p className="mt-1 text-slate-500 dark:text-slate-400">
                      Via: {selected.stops.join(", ")}
                    </p>
                  )}
                </div>
                <div className="border-t border-slate-100 pt-2.5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <p>
                    {selected.product} · {formatLiters(selected.quantityLiters)}
                  </p>
                  <p>Departed: {selected.departureTime}</p>
                  <p>
                    {selected.actualArrival ? "Arrived" : "Expected"}:{" "}
                    {selected.actualArrival ?? selected.expectedArrival}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Click a tanker on the map, or search by tanker number / driver licence, to see its
                complete route and live status.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
