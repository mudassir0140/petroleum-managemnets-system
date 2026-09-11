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
    departureTime: "02:00 AM",
    expectedArrival: "10:00 PM",
    progress: 55,
    location: "Indus Highway, near Sukkur",
    route: routeToPump(1, "PSO Pump 1 — Karachi"),
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
    departureTime: "05:30 AM",
    expectedArrival: "03:30 PM",
    progress: 40,
    location: "Indus Highway, near Kot Addu",
    route: routeToPump(2, "PSO Pump 2 — Lahore"),
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
    departureTime: "06:00 AM",
    expectedArrival: "12:30 PM",
    progress: 25,
    location: "Kohat Road, near Kohat",
    route: routeToPump(5, "PSO Pump 5 — Rawalpindi"),
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
    departureTime: "05:45 AM",
    expectedArrival: "11:45 AM",
    progress: 100,
    location: "PSO Pump 3 — Kohat Road, Islamabad",
    route: routeToPump(3, "PSO Pump 3 — Islamabad"),
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
    expectedArrival: "03:00 PM",
    progress: 60,
    location: "Bhakkar Road, near Bhakkar",
    route: routeFromPump(4, "PSO Pump 4 — Faisalabad"),
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
    location: "Central Depot yard, Dera Ismail Khan",
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
    location: "Central Depot yard, Dera Ismail Khan",
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
    departureTime: "06:30 AM",
    expectedArrival: "11:30 AM",
    progress: 70,
    location: "Indus Highway, near Dera Ghazi Khan",
    route: routeToPump(6, "PSO Pump 6 — Multan"),
  },
];

/** Static network markers: the company depot plus every PSO pump. */
export const NETWORK_NODES: GeoPoint[] = [
  DEPOT_POINT,
  ...PUMPS.map((p) => pumpPoint(p.number, `PSO Pump ${p.number} — ${p.city}`)),
];

/** Interpolates the tanker's current lat/lng along its full multi-stop route based on `progress` (0-100). */
export function currentPosition(tanker: Tanker): GeoPoint {
  return positionAlongRoute(tanker.route, tanker.progress);
}
