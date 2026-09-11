import { PUMPS } from "@/lib/data/pumps";
import type { TankerTrip, TripStatus } from "@/lib/types";

export type MapPoint = {
  id: string;
  name: string;
  kind: "depot" | "pump";
  city: string;
  top: number;
  left: number;
};

/** The configured demo company location — every scheduled trip defaults to this depot. */
export const COMPANY_DEPOT_NAME = "Lucknow Central Depot";

const DEPOT_POSITIONS: Record<string, { top: number; left: number; city: string }> = {
  "Lucknow Central Depot": { top: 18, left: 60, city: "Lucknow" },
  "Kanpur Depot": { top: 76, left: 32, city: "Kanpur" },
};

const PUMP_POSITIONS: Record<string, { top: number; left: number }> = {
  "pmp-019": { top: 24, left: 63 }, // North Bypass Pump
  "pmp-041": { top: 34, left: 56 }, // Old Town Fuel Point
  "pmp-014": { top: 32, left: 64 }, // Ashoka Road Fuel Point
  "pmp-021": { top: 42, left: 70 }, // Highway 44 Service Station
  "pmp-011": { top: 44, left: 58 }, // Airport Road Pump
  "pmp-007": { top: 66, left: 36 }, // Central Market Pump
  "pmp-033": { top: 70, left: 44 }, // Riverside Fuel Station
  "pmp-026": { top: 78, left: 26 }, // Industrial Area Station
};

export const DEPOT_POINTS: MapPoint[] = Object.entries(DEPOT_POSITIONS).map(([name, pos]) => ({
  id: name,
  name,
  kind: "depot" as const,
  city: pos.city,
  top: pos.top,
  left: pos.left,
}));

export const PUMP_POINTS: MapPoint[] = PUMPS.map((pump) => {
  const pos = PUMP_POSITIONS[pump.id] ?? { top: 50, left: 50 };
  return {
    id: pump.id,
    name: pump.name,
    kind: "pump" as const,
    city: pump.city,
    top: pos.top,
    left: pos.left,
  };
});

export const MAP_POINTS: MapPoint[] = [...DEPOT_POINTS, ...PUMP_POINTS];

export function depotPoint(name: string): MapPoint {
  return DEPOT_POINTS.find((p) => p.id === name) ?? DEPOT_POINTS[0];
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
  status: TripStatus;
  product: string;
  quantityLiters: number;
  departureTime: string;
  expectedArrival: string;
  actualArrival: string | null;
};

function stopsFor(from: MapPoint, to: MapPoint): string[] {
  if (from.city !== to.city) {
    return [`${from.city}–${to.city} Highway Checkpoint`];
  }
  return [];
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
    const depot = depotPoint(trip.originDepot);
    const pump = pumpPoint(trip.destinationPumpId);
    if (!pump) continue;

    routes.push({
      key: trip.id,
      tripId: trip.id,
      tankerId: trip.tankerId,
      driverId: trip.driverId,
      direction: "delivery",
      from: depot,
      to: pump,
      stops: stopsFor(depot, pump),
      status: trip.status,
      product: trip.product,
      quantityLiters: trip.quantityLiters,
      departureTime: trip.departureTime,
      expectedArrival: trip.expectedArrival,
      actualArrival: trip.actualArrival,
    });

    if (trip.status === "delivered") {
      routes.push({
        key: `${trip.id}-return`,
        tripId: trip.id,
        tankerId: trip.tankerId,
        driverId: trip.driverId,
        direction: "return",
        from: pump,
        to: depot,
        stops: stopsFor(pump, depot),
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
