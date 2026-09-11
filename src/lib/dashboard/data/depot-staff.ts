import { TANKERS } from "@/lib/dashboard/data/tankers";
import type { FuelType } from "@/lib/dashboard/data/stations";

export const LOADING_BAYS = ["Bay 1", "Bay 2", "Bay 3", "Bay 4"] as const;
export type LoadingBay = (typeof LOADING_BAYS)[number];

export type TankerLoadingStatus = "Scheduled" | "Loading" | "Completed";

export type TankerLoading = {
  id: string;
  tankerId: string;
  driver: string;
  fuelType: FuelType;
  bay: LoadingBay;
  targetLiters: number;
  status: TankerLoadingStatus;
  scheduledDate: string;
  scheduledTime: string;
};

export const TANKER_LOADINGS: TankerLoading[] = [
  { id: "LD-401", tankerId: "T-106", driver: "Faisal Mahmood", fuelType: "hi-octane", bay: "Bay 1", targetLiters: 15000, status: "Loading", scheduledDate: "2026-09-11", scheduledTime: "09:00" },
  { id: "LD-402", tankerId: "T-107", driver: "Bilal Aslam", fuelType: "petrol", bay: "Bay 2", targetLiters: 15000, status: "Scheduled", scheduledDate: "2026-09-11", scheduledTime: "11:30" },
  { id: "LD-403", tankerId: "T-101", driver: "Nasir Hussain", fuelType: "petrol", bay: "Bay 1", targetLiters: 15000, status: "Completed", scheduledDate: "2026-09-10", scheduledTime: "01:00" },
  { id: "LD-404", tankerId: "T-102", driver: "Tariq Javed", fuelType: "diesel", bay: "Bay 3", targetLiters: 18000, status: "Completed", scheduledDate: "2026-09-10", scheduledTime: "04:30" },
  { id: "LD-405", tankerId: "T-103", driver: "Adnan Malik", fuelType: "petrol", bay: "Bay 2", targetLiters: 15000, status: "Completed", scheduledDate: "2026-09-09", scheduledTime: "23:00" },
  { id: "LD-406", tankerId: "T-108", driver: "Rashid Latif", fuelType: "diesel", bay: "Bay 4", targetLiters: 18000, status: "Completed", scheduledDate: "2026-09-09", scheduledTime: "05:00" },
];

export type LoadingLogEntry = {
  id: string;
  tankerId: string;
  driver: string;
  fuelType: FuelType;
  bay: LoadingBay;
  orderedLiters: number;
  loadedLiters: number;
  startTime: string;
  endTime: string;
  date: string;
  loadedBy: string;
};

export const LOADING_LOG: LoadingLogEntry[] = [
  { id: "LOG-601", tankerId: "T-101", driver: "Nasir Hussain", fuelType: "petrol", bay: "Bay 1", orderedLiters: 15000, loadedLiters: 15000, startTime: "00:15", endTime: "01:00", date: "2026-09-10", loadedBy: "Shakeel Anwar" },
  { id: "LOG-602", tankerId: "T-102", driver: "Tariq Javed", fuelType: "diesel", bay: "Bay 3", orderedLiters: 18000, loadedLiters: 17950, startTime: "03:50", endTime: "04:35", date: "2026-09-10", loadedBy: "Nadeem Qureshi" },
  { id: "LOG-603", tankerId: "T-103", driver: "Adnan Malik", fuelType: "petrol", bay: "Bay 2", orderedLiters: 15000, loadedLiters: 15000, startTime: "22:15", endTime: "23:00", date: "2026-09-09", loadedBy: "Shakeel Anwar" },
  { id: "LOG-604", tankerId: "T-108", driver: "Rashid Latif", fuelType: "diesel", bay: "Bay 4", orderedLiters: 18000, loadedLiters: 17880, startTime: "04:10", endTime: "05:00", date: "2026-09-09", loadedBy: "Imtiaz Alam" },
  { id: "LOG-605", tankerId: "T-104", driver: "Shahid Iqbal", fuelType: "petrol", bay: "Bay 1", orderedLiters: 12000, loadedLiters: 12000, startTime: "23:20", endTime: "23:55", date: "2026-09-08", loadedBy: "Nadeem Qureshi" },
  { id: "LOG-606", tankerId: "T-105", driver: "Kashif Bhatti", fuelType: "diesel", bay: "Bay 3", orderedLiters: 18000, loadedLiters: 17600, startTime: "01:05", endTime: "02:00", date: "2026-09-08", loadedBy: "Imtiaz Alam" },
];

export function loadingDurationMinutes(entry: LoadingLogEntry): number {
  const [startH, startM] = entry.startTime.split(":").map(Number);
  const [endH, endM] = entry.endTime.split(":").map(Number);
  const start = startH * 60 + startM;
  const end = endH * 60 + endM;
  return end >= start ? end - start : end + 24 * 60 - start;
}

export function loadingVariance(entry: LoadingLogEntry): number {
  return entry.loadedLiters - entry.orderedLiters;
}

export type StockReading = {
  id: string;
  tankId: string;
  fuelType: FuelType;
  reportedLevel: number;
  reportedBy: string;
  date: string;
  time: string;
  notes: string;
};

export const STOCK_READINGS: StockReading[] = [
  { id: "SR-701", tankId: "TNK-D1", fuelType: "petrol", reportedLevel: 610500, reportedBy: "Shakeel Anwar", date: "2026-09-11", time: "06:00", notes: "Morning dip reading, consistent with system." },
  { id: "SR-702", tankId: "TNK-D2", fuelType: "diesel", reportedLevel: 497200, reportedBy: "Shakeel Anwar", date: "2026-09-11", time: "06:05", notes: "Slight variance, within tolerance." },
  { id: "SR-703", tankId: "TNK-D3", fuelType: "hi-octane", reportedLevel: 73600, reportedBy: "Nadeem Qureshi", date: "2026-09-11", time: "06:10", notes: "" },
  { id: "SR-704", tankId: "TNK-D1", fuelType: "petrol", reportedLevel: 615000, reportedBy: "Imtiaz Alam", date: "2026-09-10", time: "18:00", notes: "Evening reading before shift handover." },
  { id: "SR-705", tankId: "TNK-D2", fuelType: "diesel", reportedLevel: 500100, reportedBy: "Imtiaz Alam", date: "2026-09-10", time: "18:05", notes: "" },
  { id: "SR-706", tankId: "TNK-D3", fuelType: "hi-octane", reportedLevel: 74200, reportedBy: "Nadeem Qureshi", date: "2026-09-10", time: "06:00", notes: "" },
];

export const DEPOT_STAFF = ["Shakeel Anwar", "Nadeem Qureshi", "Imtiaz Alam"];

export function tankerFor(tankerId: string) {
  return TANKERS.find((t) => t.id === tankerId) ?? null;
}
