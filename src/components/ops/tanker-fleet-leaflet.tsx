"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useMemo } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import { COMPANY_LOCATION, positionAlongRoute } from "@/lib/dashboard/data/stations";
import type { MapPoint, TankerRoute } from "@/lib/data/tanker-map";
import type { Driver, Tanker } from "@/lib/types";

const DIRECTION_COLOR = {
  delivery: "#10b981",
  return: "#f97316",
} as const;

function divIcon(html: string, size: number) {
  return L.divIcon({
    html,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function nodeIcon(isDepot: boolean) {
  const bg = isDepot ? "#f59e0b" : "#0ea5e9";
  return divIcon(
    `<div style="width:22px;height:22px;border-radius:9999px;background:${bg};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;font-size:11px;">${
      isDepot ? "🏭" : "⛽"
    }</div>`,
    22,
  );
}

function tankerIcon(direction: TankerRoute["direction"], selected: boolean, dimmed: boolean) {
  const color = DIRECTION_COLOR[direction];
  const ring = selected ? "0 0 0 3px rgba(255,255,255,0.9), 0 0 0 5px " + color : "0 1px 4px rgba(0,0,0,.5)";
  return divIcon(
    `<div style="position:relative;width:20px;height:20px;opacity:${dimmed ? 0.3 : 1};">
      <span style="position:absolute;inset:0;border-radius:9999px;background:${color};opacity:.55;animation:tanker-pulse 1.6s ease-out infinite;"></span>
      <div style="position:relative;width:20px;height:20px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:${ring};display:flex;align-items:center;justify-content:center;font-size:11px;">🚚</div>
    </div>
    <style>@keyframes tanker-pulse{0%{transform:scale(.6);opacity:.6}100%{transform:scale(2.1);opacity:0}}</style>`,
    20,
  );
}

export function TankerFleetLeaflet({
  points,
  routes,
  progress,
  selectedKey,
  onSelect,
  isMatch,
  hasSearch,
  tankerById,
  driverById,
}: {
  points: MapPoint[];
  routes: TankerRoute[];
  progress: Record<string, number>;
  selectedKey: string | null;
  onSelect: (key: string) => void;
  isMatch: (route: TankerRoute) => boolean;
  hasSearch: boolean;
  tankerById: (id: string) => Tanker | null;
  driverById: (id: string) => Driver | null;
}) {
  const depotIcon = useMemo(() => nodeIcon(true), []);
  const pumpIcon = useMemo(() => nodeIcon(false), []);

  return (
    <MapContainer
      center={[COMPANY_LOCATION.lat, COMPANY_LOCATION.lng]}
      zoom={6}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {points.map((point) => (
        <Marker
          key={point.id}
          position={[point.lat, point.lng]}
          icon={point.kind === "depot" ? depotIcon : pumpIcon}
        >
          <Popup>{point.name}</Popup>
        </Marker>
      ))}

      {routes
        .filter((route) => route.path.length > 1)
        .map((route) => {
          const dimmed = hasSearch && !isMatch(route);
          const isSelected = route.key === selectedKey;
          return (
            <Polyline
              key={route.key}
              positions={route.path.map((p) => [p.lat, p.lng] as [number, number])}
              pathOptions={{
                color: DIRECTION_COLOR[route.direction],
                weight: isSelected ? 4 : 2.5,
                opacity: dimmed ? 0.15 : isSelected ? 0.95 : 0.55,
                dashArray: "8 6",
              }}
              eventHandlers={{ click: () => onSelect(route.key) }}
            />
          );
        })}

      {routes
        .filter((route) => route.path.length > 0)
        .map((route) => {
          const pos = positionAlongRoute(route.path, progress[route.key] ?? 0);
          const dimmed = hasSearch && !isMatch(route);
          const tanker = tankerById(route.tankerId);
          const driver = driverById(route.driverId);
          return (
            <Marker
              key={route.key}
              position={[pos.lat, pos.lng]}
              icon={tankerIcon(route.direction, route.key === selectedKey, dimmed)}
              eventHandlers={{ click: () => onSelect(route.key) }}
            >
              <Popup>
                <strong>{tanker?.regNumber ?? route.tankerId}</strong>
                <br />
                {driver?.name}
                <br />
                {route.direction === "delivery" ? "Delivering" : "Returning"}
              </Popup>
            </Marker>
          );
        })}
    </MapContainer>
  );
}
