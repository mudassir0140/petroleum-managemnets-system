// @ts-nocheck
import type { FuelType } from "@/lib/dashboard/data/stations";

export type TripStatus = "Scheduled" | "Assigned" | "Departed" | "Arrived";

export type Trip = {
  id: string;
  tankerId: string;
  fuelType: FuelType;
  quantity: number;
  scheduledDate: string;
  scheduledTime: string;
  driver: string | null;
  destinationPump: string | null;
  departureTime: string | null;
  arrivalTime: string | null;
  status: TripStatus;
  notes: string;
};

export const TRIPS: Trip[] = [];
