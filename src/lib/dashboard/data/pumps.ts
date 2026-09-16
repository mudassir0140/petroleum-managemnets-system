// @ts-nocheck
import type { FuelType } from "@/lib/dashboard/data/stations";

export type PumpStatus = "Online" | "Offline" | "Maintenance";

export type PumpFuelSale = { fuelType: FuelType; liters: number; revenue: number };

export type Pump = {
  id: string;
  number: number;
  name: string;
  owner: string;
  ownerEmail: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  status: PumpStatus;
  since: string;
  lastInspection: string;
  todaySales: PumpFuelSale[];
  weeklyRevenue: number[];
  monthlySales: number;
  lastMonthSales: number;
};

export const PUMPS: Pump[] = [];

export function pumpById(id: string): Pump | null {
  return PUMPS.find((pump) => pump.id === id) ?? null;
}

export function pumpTodayLiters(pump: Pump): number {
  return pump.todaySales.reduce((sum, s) => sum + s.liters, 0);
}

export function pumpTodayRevenue(pump: Pump): number {
  return pump.todaySales.reduce((sum, s) => sum + s.revenue, 0);
}

export function pumpWeeklyTotal(pump: Pump): number {
  return pump.weeklyRevenue.reduce((sum, v) => sum + v, 0);
}
