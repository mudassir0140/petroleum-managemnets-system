// @ts-nocheck
import type { FuelType } from "@/lib/dashboard/data/stations";

export type PumpStatus = "Online" | "Offline" | "Maintenance";

export type PumpFuelSale = { fuelType: FuelType; liters: number; revenue: number };

export type Pump = {
  // Identification
  id: string;
  number: number;
  name: string;

  // Owner/Account Information
  owner: string;
  ownerEmail: string;
  password: string;
  role: "pump-owner";
  accountStatus: "Active" | "Inactive" | "Suspended";

  // Location & Contact
  city: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;

  // Operational Status
  status: PumpStatus;
  since: string;
  lastInspection: string;

  // Sales Data
  todaySales: PumpFuelSale[];
  weeklyRevenue: number[];
  monthlySales: number;
  lastMonthSales: number;

  // Fuel Inventory
  petrolStock: number;
  petrolCapacity: number;
  dieselStock: number;
  dieselCapacity: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;
};

// Empty array - only pumps created by admin should appear
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
