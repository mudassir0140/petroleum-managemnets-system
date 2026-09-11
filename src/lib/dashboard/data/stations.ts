export const DEPOT = "Central Depot, Dera Ismail Khan";

/** GPS coordinates for the configured demo company location (the depot): Dera Ismail Khan, Khyber Pakhtunkhwa. */
export const COMPANY_LOCATION = { lat: 31.8313, lng: 70.9018 };

export const CITIES = ["Karachi", "Lahore", "Islamabad", "Faisalabad", "Rawalpindi", "Multan"] as const;

/** Approximate city-center GPS coordinates, used as a default when a pump's exact address isn't geocoded. */
export const CITY_COORDS: Record<(typeof CITIES)[number], { lat: number; lng: number }> = {
  Karachi: { lat: 24.8607, lng: 67.0011 },
  Lahore: { lat: 31.5497, lng: 74.3436 },
  Islamabad: { lat: 33.6844, lng: 73.0479 },
  Faisalabad: { lat: 31.4187, lng: 73.0791 },
  Rawalpindi: { lat: 33.5651, lng: 73.0169 },
  Multan: { lat: 30.1575, lng: 71.5249 },
};

export type GeoPoint = { lat: number; lng: number; label: string };

export const DEPOT_POINT: GeoPoint = { ...COMPANY_LOCATION, label: DEPOT };

/**
 * Real highway waypoints from the Dera Ismail Khan depot to each PSO pump's
 * city (keyed by pump `number`), used to plot a realistic multi-stop route
 * instead of a straight line. Shared by both the Owner and Manager
 * dashboards' tanker tracking maps so every route matches on both.
 */
export const ROUTE_WAYPOINTS: Record<number, GeoPoint[]> = {
  1: [
    // Karachi — south via the Indus Highway (N-55)
    { lat: 30.0561, lng: 70.6346, label: "Indus Highway, near Dera Ghazi Khan" },
    { lat: 27.7052, lng: 68.8574, label: "Indus Highway, near Sukkur" },
  ],
  2: [
    // Lahore — via Kot Addu, Multan, then the M-3/M-2 Motorway
    { lat: 30.4696, lng: 70.9656, label: "Indus Highway, near Kot Addu" },
    { lat: 30.1978, lng: 71.4697, label: "M-3 Motorway, near Multan" },
  ],
  3: [
    // Islamabad — north via Kohat
    { lat: 33.59, lng: 71.4425, label: "Kohat Road, near Kohat" },
  ],
  4: [
    // Faisalabad — via Bhakkar and the Faisalabad-Sargodha Road
    { lat: 31.6247, lng: 71.0656, label: "Bhakkar Road, near Bhakkar" },
    { lat: 32.0836, lng: 72.6711, label: "Faisalabad-Sargodha Road, near Sargodha" },
  ],
  5: [
    // Rawalpindi — via Kohat and GT Road near Attock
    { lat: 33.59, lng: 71.4425, label: "Kohat Road, near Kohat" },
    { lat: 33.7666, lng: 72.36, label: "GT Road, near Attock" },
  ],
  6: [
    // Multan — direct via Dera Ghazi Khan
    { lat: 30.0561, lng: 70.6346, label: "Indus Highway, near Dera Ghazi Khan" },
  ],
};

function haversine(a: GeoPoint, b: GeoPoint) {
  const dLat = a.lat - b.lat;
  const dLng = a.lng - b.lng;
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

/**
 * Interpolates a position along an ordered multi-stop path based on 0-100
 * progress, weighted by the great-circle distance of each leg (so movement
 * follows the actual path instead of just lerping between the endpoints).
 */
export function positionAlongRoute(route: GeoPoint[], progress: number): GeoPoint {
  if (route.length <= 1) return route[0];

  const segmentLengths = route.slice(1).map((point, i) => haversine(route[i], point));
  const totalLength = segmentLengths.reduce((sum, len) => sum + len, 0) || 1;
  const targetDistance = (progress / 100) * totalLength;

  let travelled = 0;
  for (let i = 0; i < segmentLengths.length; i++) {
    const segLen = segmentLengths[i];
    if (travelled + segLen >= targetDistance || i === segmentLengths.length - 1) {
      const segProgress = segLen === 0 ? 1 : (targetDistance - travelled) / segLen;
      const from = route[i];
      const to = route[i + 1];
      const t = Math.min(1, Math.max(0, segProgress));
      return {
        lat: from.lat + (to.lat - from.lat) * t,
        lng: from.lng + (to.lng - from.lng) * t,
        label: t > 0.5 ? to.label : from.label,
      };
    }
    travelled += segLen;
  }
  return route[route.length - 1];
}

export const FUEL_TYPES = ["petrol", "diesel", "hi-octane"] as const;

export type FuelType = (typeof FUEL_TYPES)[number];

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  petrol: "Petrol",
  diesel: "Diesel",
  "hi-octane": "Hi-Octane",
};
