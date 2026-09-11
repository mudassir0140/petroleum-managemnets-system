"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useMemo } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import { currentPosition, NETWORK_NODES, type Tanker } from "@/lib/dashboard/data/tankers";
import { COMPANY_LOCATION } from "@/lib/dashboard/data/stations";

const DIRECTION_COLOR = {
  outbound: "#10b981",
  return: "#f97316",
  idle: "#94a3b8",
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

function tankerIcon(direction: Tanker["direction"], selected: boolean, dimmed: boolean) {
  const color = DIRECTION_COLOR[direction];
  const ring = selected ? "0 0 0 3px rgba(255,255,255,0.9), 0 0 0 5px " + color : "0 1px 4px rgba(0,0,0,.5)";
  const pulse =
    direction !== "idle"
      ? `<span style="position:absolute;inset:0;border-radius:9999px;background:${color};opacity:.55;animation:tanker-pulse 1.6s ease-out infinite;"></span>`
      : "";
  return divIcon(
    `<div style="position:relative;width:20px;height:20px;opacity:${dimmed ? 0.3 : 1};">
      ${pulse}
      <div style="position:relative;width:20px;height:20px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:${ring};display:flex;align-items:center;justify-content:center;font-size:11px;">🚚</div>
    </div>
    <style>@keyframes tanker-pulse{0%{transform:scale(.6);opacity:.6}100%{transform:scale(2.1);opacity:0}}</style>`,
    20,
  );
}

export function TankerLiveMap({
  tankers,
  selectedId,
  onSelect,
  isMatch,
  hasSearch,
}: {
  tankers: Tanker[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isMatch: (tanker: Tanker) => boolean;
  hasSearch: boolean;
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
        attribution="Tiles &copy; Esri &mdash; Esri, HERE, Garmin, USGS, NGA, EPA, NPS"
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
        maxZoom={19}
      />

      {NETWORK_NODES.map((node, idx) => (
        <Marker key={node.label} position={[node.lat, node.lng]} icon={idx === 0 ? depotIcon : pumpIcon}>
          <Popup>{node.label}</Popup>
        </Marker>
      ))}

      {tankers
        .filter((t) => t.route.length > 1)
        .map((tanker) => {
          const dimmed = hasSearch && !isMatch(tanker);
          const isSelected = tanker.id === selectedId;
          return (
            <Polyline
              key={tanker.id}
              positions={tanker.route.map((p) => [p.lat, p.lng])}
              pathOptions={{
                color: DIRECTION_COLOR[tanker.direction],
                weight: isSelected ? 4 : 2.5,
                opacity: dimmed ? 0.15 : isSelected ? 0.95 : 0.55,
                dashArray: "8 6",
              }}
              eventHandlers={{ click: () => onSelect(tanker.id) }}
            />
          );
        })}

      {tankers.map((tanker) => {
        const pos = currentPosition(tanker);
        const dimmed = hasSearch && !isMatch(tanker);
        return (
          <Marker
            key={tanker.id}
            position={[pos.lat, pos.lng]}
            icon={tankerIcon(tanker.direction, tanker.id === selectedId, dimmed)}
            eventHandlers={{ click: () => onSelect(tanker.id) }}
          >
            <Popup>
              <strong>{tanker.id}</strong>
              <br />
              {tanker.driver}
              <br />
              {tanker.status}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
