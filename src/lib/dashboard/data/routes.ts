import { DEPOT } from "@/lib/dashboard/data/stations";
import type { FuelType } from "@/lib/dashboard/data/stations";

export type RouteStatus = "Active" | "Under Maintenance" | "Seasonal";

export type LogisticsRoute = {
  id: string;
  name: string;
  from: string;
  to: string;
  highway: string;
  distanceKm: number;
  avgDurationHrs: number;
  fuelTypes: FuelType[];
  status: RouteStatus;
};

export const ROUTES: LogisticsRoute[] = [
  { id: "RT-01", name: "Depot → Karachi", from: DEPOT, to: "PSO Pump 1 — Karachi", highway: "Indus Highway (N-55)", distanceKm: 730, avgDurationHrs: 19, fuelTypes: ["petrol", "diesel"], status: "Active" },
  { id: "RT-02", name: "Depot → Lahore", from: DEPOT, to: "PSO Pump 2 — Lahore", highway: "Indus Highway → M-3 Motorway", distanceKm: 520, avgDurationHrs: 10, fuelTypes: ["diesel", "hi-octane"], status: "Active" },
  { id: "RT-03", name: "Depot → Islamabad", from: DEPOT, to: "PSO Pump 3 — Islamabad", highway: "Kohat Road", distanceKm: 320, avgDurationHrs: 6, fuelTypes: ["petrol"], status: "Active" },
  { id: "RT-04", name: "Depot → Faisalabad", from: DEPOT, to: "PSO Pump 4 — Faisalabad", highway: "Bhakkar Road → Faisalabad-Sargodha Road", distanceKm: 480, avgDurationHrs: 9, fuelTypes: ["diesel"], status: "Active" },
  { id: "RT-05", name: "Depot → Rawalpindi", from: DEPOT, to: "PSO Pump 5 — Rawalpindi", highway: "Kohat Road → GT Road", distanceKm: 340, avgDurationHrs: 6.5, fuelTypes: ["petrol"], status: "Active" },
  { id: "RT-06", name: "Depot → Multan", from: DEPOT, to: "PSO Pump 6 — Multan", highway: "Indus Highway", distanceKm: 400, avgDurationHrs: 7, fuelTypes: ["diesel"], status: "Under Maintenance" },
];
