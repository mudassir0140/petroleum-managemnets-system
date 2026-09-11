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

export const DRIVER_TRIPS: DriverTrip[] = [
  {
    id: "TRP-601",
    driver: DEMO_DRIVER,
    tanker: "T-101",
    fuelType: "petrol",
    depot: DEPOT,
    pump: "Pump 5, Rawalpindi",
    route: "Central Depot → Indus Highway → Pump 5, Rawalpindi",
    loadedLiters: 15000,
    unloadedLiters: 15000,
    scheduledDeparture: "2026-09-09 06:15 AM",
    actualDeparture: "2026-09-09 06:20 AM",
    expectedArrival: "2026-09-09 02:30 PM",
    actualArrival: "2026-09-09 02:50 PM",
    date: "2026-09-09",
    status: "Delivered",
    deliveryConfirmed: true,
    confirmationNote: "Full quantity delivered, pump owner signed off.",
  },
  {
    id: "TRP-602",
    driver: DEMO_DRIVER,
    tanker: "T-101",
    fuelType: "petrol",
    depot: DEPOT,
    pump: "Pump 1, Karachi",
    route: "Central Depot → National Highway → Pump 1, Karachi",
    loadedLiters: 15000,
    unloadedLiters: 14900,
    scheduledDeparture: "2026-09-10 06:00 AM",
    actualDeparture: "2026-09-10 06:10 AM",
    expectedArrival: "2026-09-10 09:00 AM",
    actualArrival: "2026-09-10 09:35 AM",
    date: "2026-09-10",
    status: "Delivered",
    deliveryConfirmed: true,
    confirmationNote: "Minor evaporation loss (100L), within tolerance.",
  },
  {
    id: "TRP-603",
    driver: DEMO_DRIVER,
    tanker: "T-101",
    fuelType: "diesel",
    depot: DEPOT,
    pump: "Pump 5, Rawalpindi",
    route: "Central Depot → Indus Highway → Pump 5, Rawalpindi",
    loadedLiters: 15000,
    unloadedLiters: 0,
    scheduledDeparture: "2026-09-11 06:15 AM",
    actualDeparture: "2026-09-11 06:15 AM",
    expectedArrival: "2026-09-11 12:45 PM",
    actualArrival: null,
    date: "2026-09-11",
    status: "In Transit",
    deliveryConfirmed: false,
    confirmationNote: "",
  },
  {
    id: "TRP-604",
    driver: DEMO_DRIVER,
    tanker: "T-101",
    fuelType: "petrol",
    depot: DEPOT,
    pump: "Pump 1, Karachi",
    route: "Central Depot → National Highway → Pump 1, Karachi",
    loadedLiters: 0,
    unloadedLiters: 0,
    scheduledDeparture: "2026-09-11 02:00 PM",
    actualDeparture: null,
    expectedArrival: "2026-09-11 05:00 PM",
    actualArrival: null,
    date: "2026-09-11",
    status: "Scheduled",
    deliveryConfirmed: false,
    confirmationNote: "",
  },
  {
    id: "TRP-605",
    driver: DEMO_DRIVER,
    tanker: "T-101",
    fuelType: "diesel",
    depot: DEPOT,
    pump: "Pump 6, Multan",
    route: "Central Depot → N-5 Highway → Pump 6, Multan",
    loadedLiters: 0,
    unloadedLiters: 0,
    scheduledDeparture: "2026-09-12 06:00 AM",
    actualDeparture: null,
    expectedArrival: "2026-09-12 11:30 AM",
    actualArrival: null,
    date: "2026-09-12",
    status: "Scheduled",
    deliveryConfirmed: false,
    confirmationNote: "",
  },
];
