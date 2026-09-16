// @ts-nocheck
import type { FuelType } from "@/lib/dashboard/data/stations";
import { DEPOT } from "@/lib/dashboard/data/stations";

export type TripStatus = "Scheduled" | "In Transit" | "Delivered" | "Delayed";

export type DriverTrip = {
  id: string;
  driver: string;
  tanker: string;
  fuelType: FuelType;
  depot: string;
  pump: string;
  route: string;
  /** Fuel loaded at the depot before departure, in litres. */
  loadedLiters: number;
  /** Fuel unloaded at the pump on arrival, in litres. */
  unloadedLiters: number;
  scheduledDeparture: string;
  actualDeparture: string | null;
  expectedArrival: string;
  actualArrival: string | null;
  date: string;
  status: TripStatus;
  deliveryConfirmed: boolean;
  confirmationNote: string;
};

/** Demo driver currently "logged in" to this dashboard. */
export const DEMO_DRIVER = "Nasir Hussain";

export const DRIVER_TRIPS: DriverTrip[] = [];
