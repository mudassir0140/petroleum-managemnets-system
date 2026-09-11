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

export const FUEL_TANKS: FuelTank[] = [
  { id: "TNK-D1", site: DEPOT, fuelType: "petrol", capacity: 800000, current: 612000, reorderThreshold: 240000 },
  { id: "TNK-D2", site: DEPOT, fuelType: "diesel", capacity: 700000, current: 498000, reorderThreshold: 210000 },
  { id: "TNK-D3", site: DEPOT, fuelType: "hi-octane", capacity: 200000, current: 74000, reorderThreshold: 60000 },
  { id: "TNK-P1A", site: "Pump 1", fuelType: "petrol", capacity: 40000, current: 27600, reorderThreshold: 12000 },
  { id: "TNK-P1B", site: "Pump 1", fuelType: "diesel", capacity: 30000, current: 18400, reorderThreshold: 9000 },
  { id: "TNK-P2A", site: "Pump 2", fuelType: "petrol", capacity: 45000, current: 33200, reorderThreshold: 13500 },
  { id: "TNK-P2B", site: "Pump 2", fuelType: "diesel", capacity: 35000, current: 21100, reorderThreshold: 10500 },
  { id: "TNK-P2C", site: "Pump 2", fuelType: "hi-octane", capacity: 15000, current: 5200, reorderThreshold: 4500 },
  { id: "TNK-P3A", site: "Pump 3", fuelType: "petrol", capacity: 40000, current: 8200, reorderThreshold: 12000 },
  { id: "TNK-P3B", site: "Pump 3", fuelType: "diesel", capacity: 35000, current: 24600, reorderThreshold: 10500 },
  { id: "TNK-P4A", site: "Pump 4", fuelType: "petrol", capacity: 35000, current: 6100, reorderThreshold: 10500 },
  { id: "TNK-P4B", site: "Pump 4", fuelType: "diesel", capacity: 30000, current: 5400, reorderThreshold: 9000 },
  { id: "TNK-P5A", site: "Pump 5", fuelType: "petrol", capacity: 42000, current: 29800, reorderThreshold: 12600 },
  { id: "TNK-P5B", site: "Pump 5", fuelType: "diesel", capacity: 32000, current: 19700, reorderThreshold: 9600 },
  { id: "TNK-P5C", site: "Pump 5", fuelType: "hi-octane", capacity: 12000, current: 3100, reorderThreshold: 3600 },
  { id: "TNK-P6A", site: "Pump 6", fuelType: "petrol", capacity: 30000, current: 2400, reorderThreshold: 9000 },
  { id: "TNK-P6B", site: "Pump 6", fuelType: "diesel", capacity: 25000, current: 1800, reorderThreshold: 7500 },
];

export function tankStatus(tank: FuelTank): StockStatus {
  if (tank.current <= tank.reorderThreshold * 0.6) return "Critical";
  if (tank.current <= tank.reorderThreshold) return "Low";
  return "Healthy";
}

export function tankPercent(tank: FuelTank): number {
  return Math.round((tank.current / tank.capacity) * 100);
}

export type StockMovement = {
  id: string;
  date: string;
  type: "Received" | "Distributed";
  fuelType: FuelType;
  liters: number;
  from: string;
  to: string;
};

export const STOCK_MOVEMENTS: StockMovement[] = [
  { id: "MOV-3010", date: "2026-09-10 05:30", type: "Received", fuelType: "petrol", liters: 200000, from: "PARCO Refinery", to: DEPOT },
  { id: "MOV-3009", date: "2026-09-09 06:10", type: "Distributed", fuelType: "petrol", liters: 33000, from: DEPOT, to: "Pump 3" },
  { id: "MOV-3008", date: "2026-09-09 05:50", type: "Distributed", fuelType: "diesel", liters: 40000, from: DEPOT, to: "Pump 2" },
  { id: "MOV-3007", date: "2026-09-08 07:05", type: "Distributed", fuelType: "petrol", liters: 33000, from: DEPOT, to: "Pump 1" },
  { id: "MOV-3006", date: "2026-09-08 04:40", type: "Received", fuelType: "diesel", liters: 180000, from: "Attock Refinery", to: DEPOT },
  { id: "MOV-3005", date: "2026-09-07 06:20", type: "Distributed", fuelType: "diesel", liters: 15000, from: DEPOT, to: "Pump 5" },
  { id: "MOV-3004", date: "2026-09-07 05:15", type: "Distributed", fuelType: "hi-octane", liters: 8000, from: DEPOT, to: "Pump 2" },
  { id: "MOV-3003", date: "2026-09-06 06:30", type: "Distributed", fuelType: "petrol", liters: 30000, from: DEPOT, to: "Pump 5" },
  { id: "MOV-3002", date: "2026-09-05 09:00", type: "Received", fuelType: "hi-octane", liters: 60000, from: "PARCO Refinery", to: DEPOT },
  { id: "MOV-3001", date: "2026-09-04 06:45", type: "Distributed", fuelType: "diesel", liters: 28000, from: DEPOT, to: "Pump 3" },
  { id: "MOV-2998", date: "2026-09-03 05:00", type: "Received", fuelType: "petrol", liters: 220000, from: "PARCO Refinery", to: DEPOT },
  { id: "MOV-2995", date: "2026-09-01 06:15", type: "Distributed", fuelType: "petrol", liters: 25000, from: DEPOT, to: "Pump 6" },
];
