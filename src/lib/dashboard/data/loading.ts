import type { FuelType } from "@/lib/dashboard/data/stations";

export type LoadingStatus = "Awaiting Loading" | "Loading In Progress" | "Loaded" | "Verified" | "Dispatched";

export type LoadingOrder = {
  id: string;
  tankerId: string;
  driver: string;
  fuelType: FuelType;
  orderedLiters: number;
  /** Actual liters pumped into the tanker — null until loading finishes. */
  loadedLiters: number | null;
  bay: string;
  scheduledDate: string;
  startTime: string | null;
  endTime: string | null;
  status: LoadingStatus;
  verifiedBy: string | null;
  notes: string;
};

export const LOADING_BAYS = ["Bay 1", "Bay 2", "Bay 3"];

export const LOADING_ORDERS: LoadingOrder[] = [
  {
    id: "LOAD-4001",
    tankerId: "T-104",
    driver: "Shahid Iqbal",
    fuelType: "petrol",
    orderedLiters: 12000,
    loadedLiters: 11800,
    bay: "Bay 2",
    scheduledDate: "2026-09-10",
    startTime: "5:10 AM",
    endTime: "5:45 AM",
    status: "Verified",
    verifiedBy: "Amir Siddiqui",
    notes: "",
  },
  {
    id: "LOAD-4002",
    tankerId: "T-101",
    driver: "Nasir Hussain",
    fuelType: "petrol",
    orderedLiters: 15000,
    loadedLiters: null,
    bay: "Bay 1",
    scheduledDate: "2026-09-11",
    startTime: "1:40 AM",
    endTime: null,
    status: "Loading In Progress",
    verifiedBy: null,
    notes: "",
  },
  {
    id: "LOAD-4003",
    tankerId: "T-103",
    driver: "Adnan Malik",
    fuelType: "petrol",
    orderedLiters: 15000,
    loadedLiters: null,
    bay: "Bay 3",
    scheduledDate: "2026-09-11",
    startTime: null,
    endTime: null,
    status: "Awaiting Loading",
    verifiedBy: null,
    notes: "Waiting on bay 3 to clear",
  },
  {
    id: "LOAD-4004",
    tankerId: "T-108",
    driver: "Rashid Latif",
    fuelType: "diesel",
    orderedLiters: 18000,
    loadedLiters: 17950,
    bay: "Bay 1",
    scheduledDate: "2026-09-11",
    startTime: "6:00 AM",
    endTime: "6:35 AM",
    status: "Loaded",
    verifiedBy: null,
    notes: "",
  },
  {
    id: "LOAD-4005",
    tankerId: "T-105",
    driver: "Kashif Bhatti",
    fuelType: "diesel",
    orderedLiters: 18000,
    loadedLiters: 18000,
    bay: "Bay 2",
    scheduledDate: "2026-09-10",
    startTime: "6:35 AM",
    endTime: "7:05 AM",
    status: "Verified",
    verifiedBy: "Amir Siddiqui",
    notes: "",
  },
  {
    id: "LOAD-4006",
    tankerId: "T-106",
    driver: "Faisal Mahmood",
    fuelType: "hi-octane",
    orderedLiters: 8000,
    loadedLiters: null,
    bay: "—",
    scheduledDate: "2026-09-12",
    startTime: null,
    endTime: null,
    status: "Awaiting Loading",
    verifiedBy: null,
    notes: "",
  },
  {
    id: "LOAD-4007",
    tankerId: "T-102",
    driver: "Tariq Javed",
    fuelType: "diesel",
    orderedLiters: 18000,
    loadedLiters: 17750,
    bay: "Bay 3",
    scheduledDate: "2026-09-09",
    startTime: "5:20 AM",
    endTime: "5:55 AM",
    status: "Verified",
    verifiedBy: "Amir Siddiqui",
    notes: "",
  },
  {
    id: "LOAD-4008",
    tankerId: "T-107",
    driver: "Bilal Aslam",
    fuelType: "petrol",
    orderedLiters: 15000,
    loadedLiters: 14200,
    bay: "Bay 1",
    scheduledDate: "2026-09-11",
    startTime: "5:45 AM",
    endTime: "6:20 AM",
    status: "Loaded",
    verifiedBy: null,
    notes: "Meter reading looked low — flagged for recheck",
  },
];

export function loadingDiscrepancy(order: LoadingOrder): number | null {
  if (order.loadedLiters === null) return null;
  return order.loadedLiters - order.orderedLiters;
}
