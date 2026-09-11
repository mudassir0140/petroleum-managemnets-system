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

export const TRIPS: Trip[] = [
  {
    id: "TRIP-5001",
    tankerId: "T-101",
    fuelType: "petrol",
    quantity: 15000,
    scheduledDate: "2026-09-11",
    scheduledTime: "2:00 AM",
    driver: "Nasir Hussain",
    destinationPump: "Pump 1 — Karachi",
    departureTime: "2:00 AM",
    arrivalTime: null,
    status: "Departed",
    notes: "",
  },
  {
    id: "TRIP-5002",
    tankerId: "T-102",
    fuelType: "diesel",
    quantity: 18000,
    scheduledDate: "2026-09-11",
    scheduledTime: "5:30 AM",
    driver: "Tariq Javed",
    destinationPump: "Pump 2 — Lahore",
    departureTime: "5:30 AM",
    arrivalTime: null,
    status: "Departed",
    notes: "",
  },
  {
    id: "TRIP-5003",
    tankerId: "T-103",
    fuelType: "petrol",
    quantity: 15000,
    scheduledDate: "2026-09-11",
    scheduledTime: "6:00 AM",
    driver: "Adnan Malik",
    destinationPump: "Pump 5 — Rawalpindi",
    departureTime: "6:00 AM",
    arrivalTime: null,
    status: "Departed",
    notes: "",
  },
  {
    id: "TRIP-5004",
    tankerId: "T-104",
    fuelType: "petrol",
    quantity: 12000,
    scheduledDate: "2026-09-10",
    scheduledTime: "5:45 AM",
    driver: "Shahid Iqbal",
    destinationPump: "Pump 3 — Islamabad",
    departureTime: "5:45 AM",
    arrivalTime: "11:45 AM",
    status: "Arrived",
    notes: "",
  },
  {
    id: "TRIP-5005",
    tankerId: "T-108",
    fuelType: "diesel",
    quantity: 18000,
    scheduledDate: "2026-09-11",
    scheduledTime: "6:30 AM",
    driver: "Rashid Latif",
    destinationPump: "Pump 6 — Multan",
    departureTime: "6:30 AM",
    arrivalTime: null,
    status: "Departed",
    notes: "",
  },
  {
    id: "TRIP-5006",
    tankerId: "T-106",
    fuelType: "hi-octane",
    quantity: 8000,
    scheduledDate: "2026-09-12",
    scheduledTime: "6:30 AM",
    driver: null,
    destinationPump: null,
    departureTime: null,
    arrivalTime: null,
    status: "Scheduled",
    notes: "Awaiting driver & pump assignment",
  },
  {
    id: "TRIP-5007",
    tankerId: "T-107",
    fuelType: "petrol",
    quantity: 15000,
    scheduledDate: "2026-09-12",
    scheduledTime: "6:00 AM",
    driver: "Bilal Aslam",
    destinationPump: "Pump 3 — Islamabad",
    departureTime: null,
    arrivalTime: null,
    status: "Assigned",
    notes: "",
  },
  {
    id: "TRIP-5008",
    tankerId: "T-105",
    fuelType: "diesel",
    quantity: 18000,
    scheduledDate: "2026-09-09",
    scheduledTime: "7:00 AM",
    driver: "Kashif Bhatti",
    destinationPump: "Pump 4 — Faisalabad",
    departureTime: "7:00 AM",
    arrivalTime: "3:00 PM",
    status: "Arrived",
    notes: "",
  },
];
