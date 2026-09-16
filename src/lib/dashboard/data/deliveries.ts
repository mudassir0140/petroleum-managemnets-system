// @ts-nocheck
import type { FuelType } from "@/lib/dashboard/data/stations";
import { DEPOT } from "@/lib/dashboard/data/stations";

export type DeliveryStatus = "Delivered" | "In Transit" | "Delayed" | "Cancelled";

export type Delivery = {
  id: string;
  tanker: string;
  driver: string;
  fuelType: FuelType;
  depot: string;
  pump: string;
  route: string;
  orderedLiters: number;
  unloadedLiters: number;
  departedDepot: string;
  arrivedPump: string | null;
  date: string;
  status: DeliveryStatus;
};

export const DELIVERIES: Delivery[] = [];
