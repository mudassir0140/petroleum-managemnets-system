// @ts-nocheck
import type { FuelType } from "@/lib/dashboard/data/stations";
import { DEPOT } from "@/lib/dashboard/data/stations";

export type StockStatus = "Healthy" | "Low" | "Critical";

export type FuelTank = {
  id: string;
  site: string;
  fuelType: FuelType;
  capacity: number;
  current: number;
  reorderThreshold: number;
};

export const FUEL_TANKS: FuelTank[] = [];

export type StockMovement = {
  id: string;
  from: string;
  to: string;
  fuelType: FuelType;
  quantity?: number;
  liters?: number;
  type?: string;
  date: string;
};

export const STOCK_MOVEMENTS: StockMovement[] = [];

export function tankPercent(tank: FuelTank): number {
  return tank.capacity > 0 ? (tank.current / tank.capacity) * 100 : 0;
}

export function tankStatus(percent: number): StockStatus {
  if (percent >= 30) return "Healthy";
  if (percent >= 15) return "Low";
  return "Critical";
}
