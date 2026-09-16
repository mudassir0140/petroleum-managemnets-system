// @ts-nocheck
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

export const ROUTES: LogisticsRoute[] = [];
