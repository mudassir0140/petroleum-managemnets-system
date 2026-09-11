import type { FuelType } from "@/lib/dashboard/data/stations";
import { DEPOT } from "@/lib/dashboard/data/stations";

export type TankerStatus = "At Depot" | "In Transit" | "At Pump" | "Returning";

export type Tanker = {
  id: string;
  driver: string;
  driverPhone: string;
  capacity: number;
  fuelType: FuelType;
  status: TankerStatus;
  from: string;
  to: string;
  departureTime: string;
  expectedArrival: string;
  progress: number;
  location: string;
  mapPosition: { top: number; left: number };
};

export const TANKERS: Tanker[] = [
  { id: "T-101", driver: "Nasir Hussain", driverPhone: "+92 301 111 2233", capacity: 15000, fuelType: "petrol", status: "In Transit", from: DEPOT, to: "Pump 1", departureTime: "06:15 AM", expectedArrival: "09:00 AM", progress: 62, location: "National Highway, near Malir", mapPosition: { top: 45, left: 22 } },
  { id: "T-102", driver: "Tariq Javed", driverPhone: "+92 301 222 3344", capacity: 18000, fuelType: "diesel", status: "In Transit", from: DEPOT, to: "Pump 2", departureTime: "05:50 AM", expectedArrival: "01:30 PM", progress: 34, location: "M-9 Motorway, near Hyderabad", mapPosition: { top: 40, left: 35 } },
  { id: "T-103", driver: "Adnan Malik", driverPhone: "+92 301 333 4455", capacity: 15000, fuelType: "petrol", status: "In Transit", from: DEPOT, to: "Pump 5", departureTime: "06:30 AM", expectedArrival: "03:10 PM", progress: 21, location: "Indus Highway, near Sukkur", mapPosition: { top: 30, left: 45 } },
  { id: "T-104", driver: "Shahid Iqbal", driverPhone: "+92 301 444 5566", capacity: 12000, fuelType: "petrol", status: "At Pump", from: DEPOT, to: "Pump 3", departureTime: "06:00 AM", expectedArrival: "09:30 AM", progress: 100, location: "Pump 3 — Kohat Road, Islamabad", mapPosition: { top: 12, left: 60 } },
  { id: "T-105", driver: "Kashif Bhatti", driverPhone: "+92 301 555 6677", capacity: 18000, fuelType: "diesel", status: "Returning", from: "Pump 4", to: DEPOT, departureTime: "07:00 AM", expectedArrival: "12:15 PM", progress: 70, location: "Faisalabad-Sargodha Road", mapPosition: { top: 22, left: 40 } },
  { id: "T-106", driver: "Faisal Mahmood", driverPhone: "+92 301 666 7788", capacity: 15000, fuelType: "hi-octane", status: "At Depot", from: DEPOT, to: "—", departureTime: "—", expectedArrival: "—", progress: 0, location: "Central Depot yard, Karachi", mapPosition: { top: 48, left: 18 } },
  { id: "T-107", driver: "Bilal Aslam", driverPhone: "+92 301 777 8899", capacity: 15000, fuelType: "petrol", status: "At Depot", from: DEPOT, to: "—", departureTime: "—", expectedArrival: "—", progress: 0, location: "Central Depot yard, Karachi", mapPosition: { top: 50, left: 20 } },
  { id: "T-108", driver: "Rashid Latif", driverPhone: "+92 301 888 9900", capacity: 18000, fuelType: "diesel", status: "In Transit", from: DEPOT, to: "Pump 6", departureTime: "06:45 AM", expectedArrival: "04:00 PM", progress: 15, location: "N-5 Highway, near Nawabshah", mapPosition: { top: 38, left: 30 } },
];

export const MAP_NODES = [
  { id: "depot", label: "Central Depot — Karachi", top: 48, left: 18, kind: "depot" as const },
  { id: "pump-1", label: "Pump 1 — Karachi", top: 50, left: 20, kind: "pump" as const },
  { id: "pump-2", label: "Pump 2 — Lahore", top: 18, left: 55, kind: "pump" as const },
  { id: "pump-3", label: "Pump 3 — Islamabad", top: 10, left: 58, kind: "pump" as const },
  { id: "pump-4", label: "Pump 4 — Faisalabad", top: 20, left: 42, kind: "pump" as const },
  { id: "pump-5", label: "Pump 5 — Rawalpindi", top: 12, left: 56, kind: "pump" as const },
  { id: "pump-6", label: "Pump 6 — Multan", top: 32, left: 40, kind: "pump" as const },
];
