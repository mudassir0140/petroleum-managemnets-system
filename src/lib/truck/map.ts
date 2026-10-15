import { ObjectId, type Document } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import { SUPPLIER_ACCOUNTS, SUPPLIER_REQUESTS } from "@/lib/supplier/service";
import { BUSY_ORDER_STATUSES, TRUCKS } from "./service";
import { gpsState, tripStage } from "./gps";
import type { MapPoint, MapStop, TruckMapData, TruckMapRoute, TruckMapTrip } from "./map-types";

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

const roadRouteMemo = new Map<string, { at: number; route: Omit<TruckMapRoute, "from"> }>();

function toPoint(lat: unknown, lng: unknown): MapPoint | null {
  const a = typeof lat === "number" ? lat : NaN;
  const b = typeof lng === "number" ? lng : NaN;
  if (!Number.isFinite(a) || !Number.isFinite(b) || a < -90 || a > 90 || b < -180 || b > 180) return null;
  return { lat: a, lng: b };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
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

// Road route from OSRM. Null when OSRM does not answer.
async function roadRoute(a: MapPoint, b: MapPoint): Promise<Omit<TruckMapRoute, "from"> | null> {
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
async function routeBetween(a: MapPoint, b: MapPoint): Promise<Omit<TruckMapRoute, "from">> {
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

function haversineKm(a: MapPoint, b: MapPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

const PUMP_PROJECTION = { name: 1, address: 1, city: 1, country: 1, latitude: 1, longitude: 1 };

async function pumpDoc(id: unknown): Promise<Document | null> {
  if (!(id instanceof ObjectId)) return null;
  const db = await getDatabase();
  return db.collection("pumps").findOne({ _id: id }, { projection: PUMP_PROJECTION });
}

// The live picture of one truck: its active delivery (an accepted supplier request, or an active order
// trip), the driver's GPS position with its age, and the remaining route to the destination pump.
// Every dashboard reads this same function, from the same MongoDB data.
export async function getTruckLive(truckId: ObjectId, requestId?: ObjectId): Promise<TruckMapData | null> {
  const db = await getDatabase();
  const truck = await db.collection(TRUCKS).findOne({ _id: truckId }, { projection: { lastLocation: 1, pumpId: 1 } });
  if (!truck) return null;

  const now = Date.now();
  const fix = (truck.lastLocation ?? null) as Document | null;
  const driverPoint = toPoint(fix?.lat, fix?.lng);
  const fixAt = fix?.at instanceof Date ? fix.at : null;
  const accuracy = typeof fix?.accuracy === "number" && fix.accuracy > 0 ? Math.round(fix.accuracy) : null;
  const gps: TruckMapData["gps"] = {
    state: driverPoint ? gpsState(fixAt ? fixAt.getTime() : null, now) : "missing",
    ageSeconds: driverPoint && fixAt ? Math.max(0, Math.round((now - fixAt.getTime()) / 1000)) : null,
    accuracyM: driverPoint ? accuracy : null,
  };
  const updatedAt = fixAt ? fixAt.toISOString() : "";
  const truckPumpId = String(truck.pumpId ?? "");

  // An accepted supplier request on this truck is a delivery from the supplier. Otherwise an active order trip.
  const supplierRequest = requestId
    ? await db.collection(SUPPLIER_REQUESTS).findOne({ _id: requestId, truckId })
    : await db
        .collection(SUPPLIER_REQUESTS)
        .findOne({ truckId, status: { $in: ["accepted", "on-the-way", "arrived"] } }, { sort: { updatedAt: -1 } });
  const order = supplierRequest
    ? null
    : await db
        .collection("orders")
        .find({
          truckId,
          status: { $in: [...BUSY_ORDER_STATUSES] },
          $or: [{ driverResponse: "accepted" }, { driverResponse: { $exists: false } }],
        })
        .sort({ requestedAt: -1 })
        .limit(1)
        .next();

  if (!supplierRequest && !order) {
    return {
      active: false,
      truckPumpId,
      destinationPumpId: "",
      start: { label: "", point: null },
      destination: { label: "", point: null },
      trip: null,
      gps,
      truck: { point: driverPoint, atStart: false, updatedAt },
      route: null,
      distances: { travelledKm: null, remainingKm: null, totalKm: null },
    };
  }

  const destinationId = supplierRequest ? supplierRequest.pumpId : order?.pumpId;
  const destinationDoc = await pumpDoc(destinationId);
  const destinationName = text(destinationDoc?.name);
  const destination: MapStop = { label: `Pump / پمپ: ${destinationName || "—"}`, point: await locate(destinationDoc) };

  let start: MapStop;
  let trip: TruckMapTrip;
  if (supplierRequest) {
    const supplier = await db
      .collection(SUPPLIER_ACCOUNTS)
      .findOne(
        { _id: supplierRequest.supplierId },
        { projection: { name: 1, companyName: 1, address: 1, city: 1, country: 1, latitude: 1, longitude: 1 } }
      );
    const supplierName = text(supplier?.companyName) || text(supplier?.name);
    // The pickup is the supplier's saved or looked-up position. Without one, it is where the truck was dispatched.
    const supplierPoint = await locate(supplier);
    const dispatch = (supplierRequest.dispatchPoint ?? null) as Document | null;
    const dispatchPoint = toPoint(dispatch?.lat, dispatch?.lng);
    start = supplierPoint
      ? { label: `Supplier / سپلائر: ${supplierName || "—"}`, point: supplierPoint }
      : { label: `Truck at dispatch / روانگی کا مقام${supplierName ? ` (${supplierName})` : ""}`, point: dispatchPoint };
    trip = {
      orderId: String(supplierRequest._id),
      orderNumber: `REQ-${String(supplierRequest._id).slice(-6).toUpperCase()}`,
      source: "supplier",
      pickupCompany: supplierName || "—",
      destinationPump: destinationName || "—",
      fuelType: text(supplierRequest.fuelType),
      quantityLitres: Number(supplierRequest.litres) || 0,
      stage: tripStage(text(supplierRequest.status)) ?? "accepted",
      arrivedAt: supplierRequest.arrivedAt instanceof Date ? supplierRequest.arrivedAt.toISOString() : "",
      arrivalSource: supplierRequest.arrivalSource === "gps" ? "gps" : supplierRequest.arrivalSource === "driver" ? "driver" : "",
      expectedArrival: "",
    };
  } else {
    // Order trips start at the truck's own pump, which is the pickup for its fuel.
    const pickupDoc = await pumpDoc(truck.pumpId);
    const pickupName = text(pickupDoc?.name);
    start = { label: `Pickup pump / لوڈنگ پمپ: ${pickupName || "—"}`, point: await locate(pickupDoc) };
    const o = order as Document;
    trip = {
      orderId: String(o._id),
      orderNumber: text(o.trackingNumber) || `ORD-${String(o._id).slice(-6).toUpperCase()}`,
      source: "order",
      pickupCompany: pickupName || "—",
      destinationPump: destinationName || "—",
      fuelType: o.fuelType === "diesel" ? "diesel" : "petrol",
      quantityLitres: Number(o.quantityLitres) || 0,
      stage: tripStage(text(o.status)) ?? "accepted",
      arrivedAt: o.arrivedAt instanceof Date ? o.arrivedAt.toISOString() : "",
      arrivalSource: o.arrivalSource === "gps" ? "gps" : o.arrivalSource === "driver" ? "driver" : "",
      expectedArrival: o.expectedArrival instanceof Date ? o.expectedArrival.toISOString() : "",
    };
  }

  // Remaining route: from the driver's live position when there is one, otherwise from the start.
  const origin = driverPoint ?? start.point;
  const routeBase = origin && destination.point ? await routeBetween(origin, destination.point) : null;

  const travelledM = supplierRequest && typeof supplierRequest.travelledM === "number" ? supplierRequest.travelledM : null;
  const totalBase = start.point && destination.point ? await routeBetween(start.point, destination.point) : null;
  const distances = {
    travelledKm: travelledM === null ? null : Math.round(travelledM / 10) / 100,
    // Remaining is measured from the truck's own position only; without GPS there is no honest remaining figure.
    remainingKm: routeBase && driverPoint ? routeBase.distanceKm : null,
    totalKm: totalBase ? totalBase.distanceKm : null,
  };

  return {
    active: true,
    truckPumpId,
    destinationPumpId: String(destinationId ?? ""),
    start,
    destination,
    trip,
    gps,
    truck: { point: driverPoint ?? start.point, atStart: !driverPoint && start.point !== null, updatedAt },
    route: routeBase ? { ...routeBase, from: driverPoint ? "truck" : "start" } : null,
    distances,
  };
}
