import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import { ACTIVE_TRIP_STATUSES } from "./types";
import { TRUCKS } from "./service";

// Routes come from OSRM, called from the server. Nothing is estimated when OSRM or the
// coordinates are missing: the result is null and the UI says so.
const OSRM_BASE = "https://router.project-osrm.org";
const TIMEOUT_MS = 8000;

export interface Point {
  lat: number;
  lng: number;
}

export interface RouteResult {
  origin: Point;
  destination: Point;
  distanceKm: number;
  durationMin: number;
  geometry: [number, number][]; // [lat, lng] pairs for drawing
  currentRoad: string | null;
  originSource: "live-location" | "pickup-pump";
}

function validPoint(value: unknown): Point | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const lat = typeof v.latitude === "number" ? v.latitude : typeof v.lat === "number" ? v.lat : null;
  const lng = typeof v.longitude === "number" ? v.longitude : typeof v.lng === "number" ? v.lng : null;
  if (lat === null || lng === null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

interface OsrmResponse {
  routes?: { distance: number; duration: number; geometry?: { coordinates?: [number, number][] } }[];
  waypoints?: { name?: string }[];
}

async function osrmJson(url: string): Promise<OsrmResponse | null> {
  try {
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

// Road name at a point, used for "current road".
export async function nearestRoadName(point: Point): Promise<string | null> {
  const data = await osrmJson(`${OSRM_BASE}/nearest/v1/driving/${point.lng},${point.lat}?number=1`);
  const name = data?.waypoints?.[0]?.name;
  return typeof name === "string" && name !== "" ? name : null;
}

export async function fetchRoute(origin: Point, destination: Point): Promise<Omit<RouteResult, "originSource"> | null> {
  const data = await osrmJson(
    `${OSRM_BASE}/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
  );
  const route = data?.routes?.[0];
  if (!route || !Array.isArray(route.geometry?.coordinates)) return null;

  const coords = route.geometry.coordinates as [number, number][];
  return {
    origin,
    destination,
    distanceKm: Math.round((Number(route.distance) / 1000) * 10) / 10,
    durationMin: Math.round(Number(route.duration) / 60),
    geometry: coords.map(([lng, lat]) => [lat, lng] as [number, number]),
    currentRoad: await nearestRoadName(origin),
  };
}

// The route for a truck's active trip: from its live location (or its pickup pump when there is
// no location yet) to the pump the order is going to.
export async function routeForTruck(truckId: ObjectId): Promise<RouteResult | null> {
  const db = await getDatabase();
  const truck = await db.collection(TRUCKS).findOne({ _id: truckId }, { projection: { pumpId: 1, lastLocation: 1 } });
  if (!truck) return null;

  const trip = await db
    .collection("orders")
    .find({ truckId, status: { $in: [...ACTIVE_TRIP_STATUSES] } })
    .sort({ requestedAt: -1 })
    .limit(1)
    .next();
  if (!trip || !(trip.pumpId instanceof ObjectId)) return null;

  const pumps = await db
    .collection("pumps")
    .find({ _id: { $in: [trip.pumpId, truck.pumpId].filter((id): id is ObjectId => id instanceof ObjectId) } })
    .project({ latitude: 1, longitude: 1 })
    .toArray();
  const pumpPoint = (id: unknown): Point | null => {
    const pump = pumps.find((p) => String(p._id) === String(id));
    return pump ? validPoint(pump) : null;
  };

  const destination = pumpPoint(trip.pumpId);
  const live = validPoint(truck.lastLocation);
  const origin = live ?? (truck.pumpId ? pumpPoint(truck.pumpId) : null);
  if (!destination || !origin) return null;

  const route = await fetchRoute(origin, destination);
  if (!route) return null;
  return { ...route, originSource: live ? "live-location" : "pickup-pump" };
}
