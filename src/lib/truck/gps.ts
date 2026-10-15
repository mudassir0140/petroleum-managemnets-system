// Pure GPS and delivery rules, shared by the server, the dashboards and the tests.
// This file has no imports on purpose, so it can be loaded on its own.

// A position older than this is stale: it is shown as stale and never used to detect arrival.
export const GPS_STALE_AFTER_SECONDS = 120;
// Arrival needs a fix at least this accurate, in metres.
export const GPS_MAX_ACCURACY_M = 100;
// Within this distance of the destination pump, the truck has arrived, in metres.
export const ARRIVAL_RADIUS_M = 250;

export type GpsState = "live" | "stale" | "missing";

// updatedAtMs is the time the server received the position, or null when there is none.
export function gpsState(updatedAtMs: number | null, nowMs: number): GpsState {
  if (updatedAtMs === null || !Number.isFinite(updatedAtMs)) return "missing";
  return nowMs - updatedAtMs > GPS_STALE_AFTER_SECONDS * 1000 ? "stale" : "live";
}

// Great-circle distance between two points, in metres.
export function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const earthRadiusM = 6371000;
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusM * Math.asin(Math.min(1, Math.sqrt(h)));
}

// True when the fix is accurate enough and inside the arrival radius. accuracy 0 or missing means unknown.
export function hasArrived(fix: { lat: number; lng: number; accuracy: number | null }, destination: { lat: number; lng: number }): boolean {
  if (fix.accuracy === null || !(fix.accuracy > 0) || fix.accuracy > GPS_MAX_ACCURACY_M) return false;
  return haversineMeters(fix, destination) <= ARRIVAL_RADIUS_M;
}

// The stages a delivery goes through, from the order's stored status.
export type TripStage = "accepted" | "on-the-way" | "arrived" | "completed";

export function tripStage(orderStatus: string): TripStage | null {
  switch (orderStatus) {
    case "accepted":
    case "dispatched":
      return "accepted";
    case "on-the-way":
      return "on-the-way";
    case "delivered":
      return "arrived";
    case "completed":
      return "completed";
    default:
      return null;
  }
}

export const TRIP_STAGE_LABELS: Record<TripStage, { en: string; ur: string }> = {
  accepted: { en: "Assigned, not moving yet", ur: "تفویض شدہ، ابھی نہیں چلا" },
  "on-the-way": { en: "On the way", ur: "راستے میں" },
  arrived: { en: "Arrived, waiting for owner confirmation", ur: "پہنچ گیا، مالک کی تصدیق کا انتظار" },
  completed: { en: "Delivery completed", ur: "ترسیل مکمل" },
};

export const GPS_STATE_LABELS: Record<GpsState, { en: string; ur: string }> = {
  live: { en: "Live GPS", ur: "لائیو GPS" },
  stale: { en: "GPS is stale (no recent update)", ur: "GPS پرانا ہے" },
  missing: { en: "No GPS position yet", ur: "ابھی GPS موجود نہیں" },
};
