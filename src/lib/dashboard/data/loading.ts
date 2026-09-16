// @ts-nocheck
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

export const LOADING_ORDERS: LoadingOrder[] = [];

export function loadingDiscrepancy(order: LoadingOrder): number | null {
  if (order.loadedLiters === null) return null;
  return order.loadedLiters - order.orderedLiters;
}
