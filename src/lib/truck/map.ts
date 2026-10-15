import { ObjectId, type Document } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import { SUPPLIER_ACCOUNTS, SUPPLIER_REQUESTS } from "@/lib/supplier/service";
import { ACTIVE_TRIP_STATUSES } from "./types";
import { TRUCKS } from "./service";
import type { MapPoint, MapStop, TruckMapData, TruckMapRoute } from "./map-types";

// Coordinates are never invented. A point comes from saved latitude/longitude, or from a Nominatim
// lookup of the saved address. Lookups are cached in MongoDB, found or not, so they are not repeated.
const GEOCODE_CACHE = "geocodeCache";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const OSRM_URL = "https://router.project-osrm.org";
const USER_AGENT = "PetroManage/1.0 (pump fleet map)";
const TIMEOUT_MS = 8000;
// Only used for the straight-line fallback, where the time is an estimate.
const AVERAGE_KMH = 40;
const ROUTE_TTL_MS = 10 * 60 * 1000;

// A cached lookup, keyed by the lower-cased address text.
interface GeocodeCacheDoc {
  _id: string;
  query?: string;
  found?: boolean;
  lat?: number | null;
  lng?: number | null;
}

const roadRouteMemo = new Map<string, { at: number; route: TruckMapRoute }>();

function toPoint(lat: unknown, lng: unknown): MapPoint | null {
  const a = typeof lat === "number" ? lat : NaN;
  const b = typeof lng === "number" ? lng : NaN;
  if (!Number.isFinite(a) || !Number.isFinite(b) || a < -90 || a > 90 || b < -180 || b > 180) return null;
  return { lat: a, lng: b };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function addressOf(doc: Document | null): string {
  if (!doc) return "";
  return [doc.address, doc.city, doc.country]
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter((v) => v !== "")
    .join(", ");
}

// One Nominatim lookup. undefined means the lookup itself failed, so it is not cached.
async function searchNominatim(query: string): Promise<MapPoint | null | undefined> {
  try {
    const response = await fetch(`${NOMINATIM_URL}?format=json&limit=1&q=${encodeURIComponent(query)}`, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return undefined;
    const data: unknown = await response.json();
    if (!Array.isArray(data)) return undefined;
    if (data.length === 0) return null;
    const first = data[0] as { lat?: unknown; lon?: unknown };
    return toPoint(Number(first.lat), Number(first.lon));
  } catch {
    return undefined;
  }
}

// The point for a saved place: its saved coordinates, otherwise the cached or looked-up address.
async function locate(doc: Document | null): Promise<MapPoint | null> {
  if (!doc) return null;
  const saved = toPoint(doc.latitude, doc.longitude);
  if (saved) return saved;

  const query = addressOf(doc).replace(/\s+/g, " ").trim();
  if (!query) return null;

  const db = await getDatabase();
  const cache = db.collection<GeocodeCacheDoc>(GEOCODE_CACHE);
  const key = query.toLowerCase();
  const cached = await cache.findOne({ _id: key });
  if (cached) return cached.found === true ? toPoint(cached.lat, cached.lng) : null;

  const found = await searchNominatim(query);
  if (found === undefined) return null;
  await cache.updateOne(
    { _id: key },
    {
      $set: { query, found: found !== null, lat: found?.lat ?? null, lng: found?.lng ?? null, updatedAt: new Date() },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );
  return found;
}

function haversineKm(a: MapPoint, b: MapPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

async function roadRoute(a: MapPoint, b: MapPoint): Promise<TruckMapRoute | null> {
  try {
    const response = await fetch(`${OSRM_URL}/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`, {
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const data = await response.json();
    const route = data?.routes?.[0];
    const coords = route?.geometry?.coordinates;
    if (!route || !Array.isArray(coords) || coords.length < 2) return null;
    return {
      geometry: (coords as [number, number][]).map(([lng, lat]) => [lat, lng] as [number, number]),
      distanceKm: round1(Number(route.distance) / 1000),
      durationMin: Math.round(Number(route.duration) / 60),
      source: "road",
    };
  } catch {
    return null;
  }
}

// Road route when OSRM answers, otherwise the straight line with an estimated time.
async function routeBetween(a: MapPoint, b: MapPoint): Promise<TruckMapRoute> {
  const key = `${a.lat},${a.lng}|${b.lat},${b.lng}`;
  const memo = roadRouteMemo.get(key);
  if (memo && Date.now() - memo.at < ROUTE_TTL_MS) return memo.route;

  const road = await roadRoute(a, b);
  if (road) {
    roadRouteMemo.set(key, { at: Date.now(), route: road });
    return road;
  }
  const km = haversineKm(a, b);
  return {
    geometry: [
      [a.lat, a.lng],
      [b.lat, b.lng],
    ],
    distanceKm: round1(km),
    durationMin: Math.round((km / AVERAGE_KMH) * 60),
    source: "straight-line",
  };
}

const PUMP_PROJECTION = { name: 1, address: 1, city: 1, country: 1, latitude: 1, longitude: 1 };

// Everything the truck map needs, read for one of the owner's trucks only.
export async function getTruckMapData(pumpId: ObjectId, truckId: ObjectId): Promise<TruckMapData | null> {
  const db = await getDatabase();
  const truck = await db.collection(TRUCKS).findOne({ _id: truckId, pumpId }, { projection: { lastLocation: 1 } });
  if (!truck) return null;

  const driverPoint = toPoint(truck.lastLocation?.lat, truck.lastLocation?.lng);
  const at = truck.lastLocation?.at;
  const updatedAt = at instanceof Date ? at.toISOString() : typeof at === "string" ? at : "";

  // An accepted supplier request on this truck is a delivery from the supplier. Otherwise, an active order trip.
  const supplierRequest = await db
    .collection(SUPPLIER_REQUESTS)
    .findOne({ truckId, pumpId, status: "accepted" }, { sort: { updatedAt: -1 } });
  const trip = supplierRequest
    ? null
    : await db
        .collection("orders")
        .find({ truckId, status: { $in: [...ACTIVE_TRIP_STATUSES] } })
        .sort({ requestedAt: -1 })
        .limit(1)
        .next();

  if (!supplierRequest && !trip) {
    return {
      active: false,
      start: { label: "", point: null },
      destination: { label: "", point: null },
      truck: { point: driverPoint, atStart: false, updatedAt },
      route: null,
    };
  }

  // Destination: the pump the delivery is going to.
  const destinationId = supplierRequest ? supplierRequest.pumpId : trip?.pumpId;
  const destinationDoc =
    destinationId instanceof ObjectId ? await db.collection("pumps").findOne({ _id: destinationId }, { projection: PUMP_PROJECTION }) : null;
  const destination: MapStop = {
    label: `Pump / پمپ: ${String(destinationDoc?.name ?? "") || "—"}`,
    point: await locate(destinationDoc),
  };

  // Start: the supplier for a supplier delivery, or the truck's pickup pump for an order trip.
  let start: MapStop;
  if (supplierRequest) {
    const supplier = await db
      .collection(SUPPLIER_ACCOUNTS)
      .findOne(
        { _id: supplierRequest.supplierId },
        { projection: { name: 1, companyName: 1, address: 1, city: 1, country: 1, latitude: 1, longitude: 1 } }
      );
    const supplierName = String(supplier?.companyName || supplier?.name || "");
    start = { label: `Supplier / سپلائر: ${supplierName || "—"}`, point: await locate(supplier) };
  } else {
    const pickupDoc = await db.collection("pumps").findOne({ _id: truck.pumpId ?? pumpId }, { projection: PUMP_PROJECTION });
    start = { label: `Pickup pump / لوڈنگ پمپ: ${String(pickupDoc?.name ?? "") || "—"}`, point: await locate(pickupDoc) };
  }

  const route = start.point && destination.point ? await routeBetween(start.point, destination.point) : null;

  return {
    active: true,
    start,
    destination,
    truck: {
      point: driverPoint ?? start.point,
      atStart: !driverPoint && start.point !== null,
      updatedAt,
    },
    route,
  };
}
