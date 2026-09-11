"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { SearchIcon } from "@/components/icons";
import { TripStatusBadge } from "@/components/ops/badge";
import { formatLiters } from "@/lib/format";
import { isRouteAnimated, staticProgressFor, type MapPoint, type TankerRoute } from "@/lib/data/tanker-map";
import type { Driver, Tanker } from "@/lib/types";

const TankerFleetLeaflet = dynamic(
  () => import("@/components/ops/tanker-fleet-leaflet").then((m) => m.TankerFleetLeaflet),
  {
    ssr: false,
    loading: () => (
      <div className="flex size-full items-center justify-center text-sm text-slate-400">
        Loading live map…
      </div>
    ),
  },
);

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

  const resolvedProgress: Record<string, number> = {};
  for (const route of routes) resolvedProgress[route.key] = progress[route.key] ?? seedFor(route);

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
        <div className="relative h-[420px] overflow-hidden rounded-xl border border-slate-200 lg:col-span-2 dark:border-slate-800">
          <TankerFleetLeaflet
            points={points}
            routes={routes}
            progress={resolvedProgress}
            selectedKey={selectedKey}
            onSelect={setSelectedKey}
            isMatch={matchesSearch}
            hasSearch={Boolean(normalizedSearch)}
            tankerById={tankerById}
            driverById={driverById}
          />
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
