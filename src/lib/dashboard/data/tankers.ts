// @ts-nocheck
import type { FuelType, GeoPoint } from "@/lib/dashboard/data/stations";
import { DEPOT, DEPOT_POINT, positionAlongRoute, ROUTE_WAYPOINTS } from "@/lib/dashboard/data/stations";
import { PUMPS } from "@/lib/dashboard/data/pumps";

export type { GeoPoint };

export type TankerStatus = "At Depot" | "In Transit" | "At Pump" | "Returning";

/** Green = Company -> Pump delivery. Orange = Pump -> Company return. */
export type TripDirection = "outbound" | "return" | "idle";

export type Tanker = {
  id: string; // Tanker Number
  driver: string;
  driverPhone: string;
  driverLicense: string;
  capacity: number;
  fuelType: FuelType;
  status: TankerStatus;
  direction: TripDirection;
  from: string;
  to: string;
  departureTime: string;
  expectedArrival: string;
  /** 0-100, position along `route` */
  progress: number;
  location: string;
  /** Complete path: starting point, stop(s), destination. */
  route: GeoPoint[];
};

function pumpPoint(number: number, label: string): GeoPoint {
  const pump = PUMPS.find((p) => p.number === number)!;
  return { lat: pump.lat, lng: pump.lng, label };
}

/** Full route from the depot to a PSO pump: depot -> real highway waypoints -> pump. */
function routeToPump(number: number, label: string): GeoPoint[] {
  return [DEPOT_POINT, ...ROUTE_WAYPOINTS[number], pumpPoint(number, label)];
}

/** Full route from a PSO pump back to the depot (the outbound route, reversed). */
function routeFromPump(number: number, label: string): GeoPoint[] {
  return [...routeToPump(number, label)].reverse();
}

export const TANKERS: Tanker[] = [];

/** Static network markers: the company depot plus every PSO pump. */
export const NETWORK_NODES: GeoPoint[] = [
  DEPOT_POINT,
  ...PUMPS.map((p) => pumpPoint(p.number, `PSO Pump ${p.number} — ${p.city}`)),
];

/** Interpolates the tanker's current lat/lng along its full multi-stop route based on `progress` (0-100). */
export function currentPosition(tanker: Tanker): GeoPoint {
  return positionAlongRoute(tanker.route, tanker.progress);
}
