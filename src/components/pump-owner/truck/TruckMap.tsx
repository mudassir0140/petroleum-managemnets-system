"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import type { MapPoint, TruckMapData } from "@/lib/truck/map-types";
import { GPS_STATE_LABELS, TRIP_STAGE_LABELS, type TripStage } from "@/lib/truck/gps";

// Loaded only in the browser (see TruckMapPanel). Leaflet draws on OpenStreetMap tiles; no key is needed.
const REFRESH_MS = 10000;
const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const MARKER_COLORS = { start: "#16a34a", destination: "#dc2626", truck: "#f59e0b" } as const;

const STAGE_STYLE: Record<TripStage, string> = {
  accepted: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
  "on-the-way": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  arrived: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

function marker(layer: L.LayerGroup, point: MapPoint, letter: string, color: string, label: string) {
  // The popup text is set as text content, never as HTML.
  const popup = document.createElement("div");
  popup.textContent = label;
  L.marker([point.lat, point.lng], {
    icon: L.divIcon({
      className: "",
      html: `<div style="background:${color};color:#fff;width:28px;height:28px;border-radius:9999px;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;font:700 12px system-ui">${letter}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    }),
  })
    .bindPopup(popup)
    .addTo(layer);
}

function routeKey(data: TruckMapData): string {
  const s = data.start.point;
  const d = data.destination.point;
  return `${s ? `${s.lat},${s.lng}` : "-"}|${d ? `${d.lat},${d.lng}` : "-"}`;
}

function formatTime(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleTimeString();
}

function ageText(seconds: number | null): string {
  if (seconds === null) return "";
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.round(seconds / 60)} min ago`;
}

// The live map for one truck. Start, destination, driver position, remaining road route, distance,
// estimated arrival, delivery stage and GPS state. Refreshed every 10 seconds. Requests never overlap:
// the next one starts only after the previous one has finished.
export default function TruckMap({ src, compact = false }: { src: string; compact?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const fittedRef = useRef<string>("");
  const [data, setData] = useState<TruckMapData | null>(null);
  const [failed, setFailed] = useState(false);

  // The map is created once per mount.
  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: !compact, scrollWheelZoom: false, attributionControl: true }).setView([0, 0], 2);
    L.tileLayer(TILE_URL, { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" }).addTo(map);
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      fittedRef.current = "";
    };
  }, [compact]);

  // Live data: the next request starts 10 seconds after the previous one has finished.
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | null = null;

    async function tick() {
      controller = new AbortController();
      try {
        const response = await fetch(src, { cache: "no-store", credentials: "include", signal: controller.signal });
        const body = await response.json().catch(() => null);
        if (!active) return;
        if (response.ok && body) {
          setData(body as TruckMapData);
          setFailed(false);
        } else {
          setFailed(true);
        }
      } catch {
        if (active) setFailed(true);
      } finally {
        if (active) timer = setTimeout(tick, REFRESH_MS);
      }
    }

    tick();
    return () => {
      active = false;
      clearTimeout(timer);
      controller?.abort();
    };
  }, [src]);

  // Redraw the markers and the route on every refresh. Re-fit the view only when the places change.
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer || !data) return;
    layer.clearLayers();

    const points: [number, number][] = [];
    if (data.route) {
      const road = data.route.source === "road";
      L.polyline(data.route.geometry, { color: road ? "#2563eb" : "#64748b", weight: 5, opacity: 0.85, dashArray: road ? undefined : "8 8" }).addTo(layer);
      points.push(...data.route.geometry);
    }
    if (data.start.point) {
      marker(layer, data.start.point, "S", MARKER_COLORS.start, data.start.label);
      points.push([data.start.point.lat, data.start.point.lng]);
    }
    if (data.destination.point) {
      marker(layer, data.destination.point, "P", MARKER_COLORS.destination, data.destination.label);
      points.push([data.destination.point.lat, data.destination.point.lng]);
    }
    if (data.truck.point) {
      marker(layer, data.truck.point, "T", MARKER_COLORS.truck, data.truck.atStart ? "Truck (at start) / ٹرک" : "Truck (driver GPS) / ٹرک");
      points.push([data.truck.point.lat, data.truck.point.lng]);
    }

    const key = routeKey(data);
    if (points.length > 0 && fittedRef.current !== key) {
      fittedRef.current = key;
      map.fitBounds(L.latLngBounds(points), { padding: [28, 28], maxZoom: 14 });
    }
  }, [data]);

  const route = data?.route ?? null;
  const trip = data?.trip ?? null;

  return (
    <div className="space-y-3">
      {data && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {trip && (
            <span className={`rounded-full px-2.5 py-1 font-semibold ${STAGE_STYLE[trip.stage]}`}>
              {TRIP_STAGE_LABELS[trip.stage].en} / {TRIP_STAGE_LABELS[trip.stage].ur}
            </span>
          )}
          {data.active && (
            <span
              className={`rounded-full px-2.5 py-1 font-semibold ${
                data.gps.state === "live"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  : data.gps.state === "stale"
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {GPS_STATE_LABELS[data.gps.state].en}
              {data.gps.state !== "missing" && data.gps.ageSeconds !== null ? ` · ${ageText(data.gps.ageSeconds)}` : ""}
            </span>
          )}
        </div>
      )}

      <div className="relative">
        <div ref={containerRef} className={`w-full overflow-hidden rounded-xl ${compact ? "h-40" : "h-80 sm:h-96"}`} />
        {data && !data.active && (
          <div className="absolute inset-0 z-[500] flex items-center justify-center rounded-xl bg-white/80 p-4 text-center text-sm font-medium text-slate-700 dark:bg-slate-900/80 dark:text-slate-200">
            No active delivery for this truck / اس ٹرک کی فعال ترسیل نہیں
          </div>
        )}
      </div>

      {failed && !data && <p className="text-xs text-amber-700 dark:text-amber-400">Map unavailable right now. Retrying… / نقشہ ابھی دستیاب نہیں</p>}

      {data?.active && (
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
            <p className="text-xs text-slate-500">Remaining / باقی</p>
            <p className="font-semibold text-slate-900 dark:text-white">{route ? `${route.distanceKm} km` : "Route unavailable"}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
            <p className="text-xs text-slate-500">Estimated arrival / متوقع وقت</p>
            <p className="font-semibold text-slate-900 dark:text-white">
              {route ? `${route.source === "road" ? "" : "~"}${route.durationMin} min` : "—"}
              {route?.source === "straight-line" && <span className="ml-1 text-xs font-normal text-slate-500">(estimate)</span>}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
            <p className="text-xs text-slate-500">Route from / راستہ</p>
            <p className="font-semibold text-slate-900 dark:text-white">{route ? (route.from === "truck" ? "Truck position" : "Start (no GPS yet)") : "—"}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
            <p className="text-xs text-slate-500">Last GPS / آخری GPS</p>
            <p className="font-semibold text-slate-900 dark:text-white">{formatTime(data.truck.updatedAt)}</p>
          </div>
        </div>
      )}

      {data?.active && !compact && (
        <ul className="grid grid-cols-1 gap-2 text-xs text-slate-700 dark:text-slate-300 sm:grid-cols-3">
          <li className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
            <span className="block font-semibold text-green-700 dark:text-green-400">Pickup company / سپلائی کمپنی</span>
            {data.start.label} {data.start.point ? "" : "· Location unavailable / مقام دستیاب نہیں"}
          </li>
          <li className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
            <span className="block font-semibold text-red-700 dark:text-red-400">Destination / منزل</span>
            {data.destination.label} {data.destination.point ? "" : "· Location unavailable / مقام دستیاب نہیں"}
          </li>
          <li className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
            <span className="block font-semibold text-amber-700 dark:text-amber-400">Truck / ٹرک</span>
            {data.truck.point
              ? data.truck.atStart
                ? "At the start (no driver GPS yet) / ابھی GPS نہیں"
                : `Driver GPS · ${data.gps.accuracyM ? `±${data.gps.accuracyM} m` : "accuracy unknown"}`
              : "Location unavailable / مقام دستیاب نہیں"}
          </li>
        </ul>
      )}
    </div>
  );
}
