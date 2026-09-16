// @ts-nocheck
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

export const TANKER_LOADINGS: TankerLoading[] = [];

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

export const LOADING_LOG: LoadingLogEntry[] = [];

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

export const STOCK_READINGS: StockReading[] = [];

export const DEPOT_STAFF = ["Shakeel Anwar", "Nadeem Qureshi", "Imtiaz Alam"];

export function tankerFor(tankerId: string) {
  return TANKERS.find((t) => t.id === tankerId) ?? null;
}
