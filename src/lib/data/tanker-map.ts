import { pumpById as psoPumpById, PUMPS as PSO_PUMPS } from "@/lib/dashboard/data/pumps";
import { DEPOT, DEPOT_POINT, type GeoPoint, ROUTE_WAYPOINTS } from "@/lib/dashboard/data/stations";
import type { TankerTrip, TripStatus } from "@/lib/manager/types";

export type MapPoint = {
  id: string;
  name: string;
  kind: "depot" | "pump";
  city: string;
  lat: number;
  lng: number;
};

/** The configured demo company location — every scheduled trip originates here. */
export const COMPANY_DEPOT_NAME = DEPOT;

export const DEPOT_POINTS: MapPoint[] = [
  { id: DEPOT, name: DEPOT, kind: "depot", city: "Dera Ismail Khan", lat: DEPOT_POINT.lat, lng: DEPOT_POINT.lng },
];

/** Every PSO pump the depot delivers to — the same real network the Owner dashboard tracks. */
export const PUMP_POINTS: MapPoint[] = PSO_PUMPS.map((pump) => ({
  id: pump.id,
  name: `PSO Pump ${pump.number} — ${pump.city}`,
  kind: "pump" as const,
  city: pump.city,
  lat: pump.lat,
  lng: pump.lng,
}));

export const MAP_POINTS: MapPoint[] = [...DEPOT_POINTS, ...PUMP_POINTS];

export function depotPoint(): MapPoint {
  return DEPOT_POINTS[0];
}

export function pumpPoint(id: string): MapPoint | null {
  return PUMP_POINTS.find((p) => p.id === id) ?? null;
}

export type RouteDirection = "delivery" | "return";

export type TankerRoute = {
  key: string;
  tripId: string;
  tankerId: string;
  driverId: string;
  direction: RouteDirection;
  from: MapPoint;
  to: MapPoint;
  stops: string[];
  /** Complete lat/lng path — starting point, real highway stop(s), destination. */
  path: GeoPoint[];
  status: TripStatus;
  product: string;
  quantityLiters: number;
  departureTime: string;
  expectedArrival: string;
  actualArrival: string | null;
};

/** Depot -> real highway waypoints -> pump (or the reverse, for a return leg). */
function pathFor(pumpId: string, direction: RouteDirection): GeoPoint[] {
  const pump = psoPumpById(pumpId);
  if (!pump) return [];
  const waypoints = ROUTE_WAYPOINTS[pump.number] ?? [];
  const pumpGeo: GeoPoint = { lat: pump.lat, lng: pump.lng, label: `PSO Pump ${pump.number} — ${pump.city}` };
  const outbound = [DEPOT_POINT, ...waypoints, pumpGeo];
  return direction === "delivery" ? outbound : [...outbound].reverse();
}

function stopsFor(path: GeoPoint[]): string[] {
  return path.slice(1, -1).map((point) => point.label);
}

/**
 * Builds the routes shown on the live tracking map from the same trips the
 * Dispatch table uses — no separate/duplicated trip data. Every trip yields
 * a green Company -> Pump delivery leg; trips already marked "delivered"
 * also get a derived orange Pump -> Company return leg, since a delivered
 * tanker is, in reality, now heading back to depot.
 */
export function deriveRoutes(trips: TankerTrip[]): TankerRoute[] {
  const routes: TankerRoute[] = [];

  for (const trip of trips) {
    const depot = depotPoint();
    const pump = pumpPoint(trip.destinationPumpId);
    if (!pump) continue;

    const deliveryPath = pathFor(trip.destinationPumpId, "delivery");
    routes.push({
      key: trip.id,
      tripId: trip.id,
      tankerId: trip.tankerId,
      driverId: trip.driverId,
      direction: "delivery",
      from: depot,
      to: pump,
      stops: stopsFor(deliveryPath),
      path: deliveryPath,
      status: trip.status,
      product: trip.product,
      quantityLiters: trip.quantityLiters,
      departureTime: trip.departureTime,
      expectedArrival: trip.expectedArrival,
      actualArrival: trip.actualArrival,
    });

    if (trip.status === "delivered") {
      const returnPath = pathFor(trip.destinationPumpId, "return");
      routes.push({
        key: `${trip.id}-return`,
        tripId: trip.id,
        tankerId: trip.tankerId,
        driverId: trip.driverId,
        direction: "return",
        from: pump,
        to: depot,
        stops: stopsFor(returnPath),
        path: returnPath,
        status: trip.status,
        product: trip.product,
        quantityLiters: trip.quantityLiters,
        departureTime: trip.actualArrival ?? trip.departureTime,
        expectedArrival: "Returning to depot",
        actualArrival: null,
      });
    }
  }

  return routes;
}

export function isRouteAnimated(route: TankerRoute): boolean {
  if (route.direction === "return") return true;
  return route.status === "in-transit" || route.status === "delayed";
}

/** Fixed progress (0-100) for legs that aren't actively moving right now. */
export function staticProgressFor(status: TripStatus): number {
  if (status === "scheduled") return 0;
  return 100;
}
