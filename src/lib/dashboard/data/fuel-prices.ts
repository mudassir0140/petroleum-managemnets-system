// @ts-nocheck
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

export const FUEL_PRICES: FuelPrice[] = [];

export type PriceLog = {
  id: string;
  date: string;
  price: number;
  fuelType: string;
};

export const PRICE_LOG: PriceLog[] = [];
