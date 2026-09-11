import type { FuelType } from "@/lib/dashboard/data/stations";

export type FuelPrice = {
  fuelType: FuelType;
  label: string;
  ourPrice: number;
  marketAvg: number;
  competitorLow: number;
  competitorHigh: number;
  change: "up" | "down" | "flat";
  changeAmount: number;
  lastUpdated: string;
};

export const FUEL_PRICES: FuelPrice[] = [
  { fuelType: "petrol", label: "Petrol", ourPrice: 281, marketAvg: 283, competitorLow: 278, competitorHigh: 288, change: "up", changeAmount: 1.5, lastUpdated: "2026-09-10 08:00" },
  { fuelType: "diesel", label: "Diesel", ourPrice: 292, marketAvg: 296, competitorLow: 289, competitorHigh: 301, change: "down", changeAmount: 2, lastUpdated: "2026-09-10 08:00" },
  { fuelType: "hi-octane", label: "Hi-Octane", ourPrice: 341, marketAvg: 345, competitorLow: 335, competitorHigh: 352, change: "flat", changeAmount: 0, lastUpdated: "2026-09-10 08:00" },
];

export type PriceLogEntry = {
  id: string;
  fuelType: FuelType;
  oldPrice: number;
  newPrice: number;
  changedBy: string;
  date: string;
};

export const PRICE_LOG: PriceLogEntry[] = [
  { id: "PLG-901", fuelType: "petrol", oldPrice: 279.5, newPrice: 281, changedBy: "Company Owner", date: "2026-09-10 08:00" },
  { id: "PLG-900", fuelType: "diesel", oldPrice: 294, newPrice: 292, changedBy: "Company Owner", date: "2026-09-10 08:00" },
  { id: "PLG-895", fuelType: "petrol", oldPrice: 277, newPrice: 279.5, changedBy: "Company Owner", date: "2026-09-08 09:15" },
  { id: "PLG-890", fuelType: "hi-octane", oldPrice: 338, newPrice: 341, changedBy: "Company Owner", date: "2026-09-06 10:30" },
  { id: "PLG-884", fuelType: "diesel", oldPrice: 290, newPrice: 294, changedBy: "Company Owner", date: "2026-09-04 07:50" },
  { id: "PLG-879", fuelType: "petrol", oldPrice: 274, newPrice: 277, changedBy: "Company Owner", date: "2026-09-02 08:20" },
];
