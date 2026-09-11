import type { FuelType } from "@/lib/dashboard/data/stations";
import { COMPANY_LOCATION, DEPOT } from "@/lib/dashboard/data/stations";
import { PUMPS } from "@/lib/dashboard/data/pumps";

export type TankerStatus = "At Depot" | "In Transit" | "At Pump" | "Returning";

/** Green = Company -> Pump delivery. Orange = Pump -> Company return. */
export type TripDirection = "outbound" | "return" | "idle";

export type GeoPoint = { lat: number; lng: number; label: string };

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

const DEPOT_POINT: GeoPoint = { ...COMPANY_LOCATION, label: DEPOT };
const MALIR: GeoPoint = { lat: 24.8926, lng: 67.1857, label: "National Highway, near Malir" };
const HYDERABAD: GeoPoint = { lat: 25.396, lng: 68.3578, label: "M-9 Motorway, near Hyderabad" };
const SUKKUR: GeoPoint = { lat: 27.7052, lng: 68.8574, label: "Indus Highway, near Sukkur" };
const NAWABSHAH: GeoPoint = { lat: 26.2442, lng: 68.41, label: "N-5 Highway, near Nawabshah" };
const FSD_SARGODHA_RD: GeoPoint = { lat: 31.55, lng: 72.95, label: "Faisalabad-Sargodha Road" };

export const TANKERS: Tanker[] = [
  {
    id: "T-101",
    driver: "Nasir Hussain",
    driverPhone: "+92 301 111 2233",
    driverLicense: "KHI-204581",
    capacity: 15000,
    fuelType: "petrol",
    status: "In Transit",
    direction: "outbound",
    from: DEPOT,
    to: "PSO Pump 1 — Karachi",
    departureTime: "06:15 AM",
    expectedArrival: "09:00 AM",
    progress: 62,
    location: "National Highway, near Malir",
    route: [DEPOT_POINT, MALIR, pumpPoint(1, "PSO Pump 1 — Karachi")],
  },
  {
    id: "T-102",
    driver: "Tariq Javed",
    driverPhone: "+92 301 222 3344",
    driverLicense: "KHI-118820",
    capacity: 18000,
    fuelType: "diesel",
    status: "In Transit",
    direction: "outbound",
    from: DEPOT,
    to: "PSO Pump 2 — Lahore",
    departureTime: "05:50 AM",
    expectedArrival: "01:30 PM",
    progress: 34,
    location: "M-9 Motorway, near Hyderabad",
    route: [DEPOT_POINT, HYDERABAD, pumpPoint(2, "PSO Pump 2 — Lahore")],
  },
  {
    id: "T-103",
    driver: "Adnan Malik",
    driverPhone: "+92 301 333 4455",
    driverLicense: "KHI-556210",
    capacity: 15000,
    fuelType: "petrol",
    status: "In Transit",
    direction: "outbound",
    from: DEPOT,
    to: "PSO Pump 5 — Rawalpindi",
    departureTime: "06:30 AM",
    expectedArrival: "03:10 PM",
    progress: 21,
    location: "Indus Highway, near Sukkur",
    route: [DEPOT_POINT, SUKKUR, pumpPoint(5, "PSO Pump 5 — Rawalpindi")],
  },
  {
    id: "T-104",
    driver: "Shahid Iqbal",
    driverPhone: "+92 301 444 5566",
    driverLicense: "ISB-772341",
    capacity: 12000,
    fuelType: "petrol",
    status: "At Pump",
    direction: "outbound",
    from: DEPOT,
    to: "PSO Pump 3 — Islamabad",
    departureTime: "06:00 AM",
    expectedArrival: "09:30 AM",
    progress: 100,
    location: "PSO Pump 3 — Kohat Road, Islamabad",
    route: [DEPOT_POINT, SUKKUR, pumpPoint(3, "PSO Pump 3 — Islamabad")],
  },
  {
    id: "T-105",
    driver: "Kashif Bhatti",
    driverPhone: "+92 301 555 6677",
    driverLicense: "FSD-390215",
    capacity: 18000,
    fuelType: "diesel",
    status: "Returning",
    direction: "return",
    from: "PSO Pump 4 — Faisalabad",
    to: DEPOT,
    departureTime: "07:00 AM",
    expectedArrival: "12:15 PM",
    progress: 70,
    location: "Faisalabad-Sargodha Road",
    route: [pumpPoint(4, "PSO Pump 4 — Faisalabad"), FSD_SARGODHA_RD, DEPOT_POINT],
  },
  {
    id: "T-106",
    driver: "Faisal Mahmood",
    driverPhone: "+92 301 666 7788",
    driverLicense: "KHI-905112",
    capacity: 15000,
    fuelType: "hi-octane",
    status: "At Depot",
    direction: "idle",
    from: DEPOT,
    to: "—",
    departureTime: "—",
    expectedArrival: "—",
    progress: 0,
    location: "Central Depot yard, Karachi",
    route: [DEPOT_POINT],
  },
  {
    id: "T-107",
    driver: "Bilal Aslam",
    driverPhone: "+92 301 777 8899",
    driverLicense: "KHI-661884",
    capacity: 15000,
    fuelType: "petrol",
    status: "At Depot",
    direction: "idle",
    from: DEPOT,
    to: "—",
    departureTime: "—",
    expectedArrival: "—",
    progress: 0,
    location: "Central Depot yard, Karachi",
    route: [DEPOT_POINT],
  },
  {
    id: "T-108",
    driver: "Rashid Latif",
    driverPhone: "+92 301 888 9900",
    driverLicense: "KHI-247733",
    capacity: 18000,
    fuelType: "diesel",
    status: "In Transit",
    direction: "outbound",
    from: DEPOT,
    to: "PSO Pump 6 — Multan",
    departureTime: "06:45 AM",
    expectedArrival: "04:00 PM",
    progress: 15,
    location: "N-5 Highway, near Nawabshah",
    route: [DEPOT_POINT, NAWABSHAH, pumpPoint(6, "PSO Pump 6 — Multan")],
  },
];

/** Static network markers: the company depot plus every PSO pump. */
export const NETWORK_NODES: GeoPoint[] = [
  DEPOT_POINT,
  ...PUMPS.map((p) => pumpPoint(p.number, `PSO Pump ${p.number} — ${p.city}`)),
];

const BOUNDS = { minLat: 24.2, maxLat: 34.2, minLng: 66.4, maxLng: 75.3 };

/** Project a lat/lng into a 0-100 percentage box for a responsive SVG/CSS map. */
export function projectGeo(lat: number, lng: number): { xPct: number; yPct: number } {
  const xPct = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 100;
  const yPct = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100;
  return { xPct: Math.min(100, Math.max(0, xPct)), yPct: Math.min(100, Math.max(0, yPct)) };
}

function haversine(a: GeoPoint, b: GeoPoint) {
  const dLat = a.lat - b.lat;
  const dLng = a.lng - b.lng;
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

/** Interpolates the tanker's current lat/lng along its full multi-stop route based on `progress` (0-100). */
export function currentPosition(tanker: Tanker): GeoPoint {
  const { route, progress } = tanker;
  if (route.length === 1) return route[0];

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
