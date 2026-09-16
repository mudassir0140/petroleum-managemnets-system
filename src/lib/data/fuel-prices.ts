import type { FuelPriceState } from "@/lib/manager/types";

export const FUEL_PRICE_SEED: FuelPriceState = {
  prices: [],
  updatedAt: "",
  updatedBy: "",
};

export const FUEL_PRICE_HISTORY_SEED: {
  id: string;
  product: string;
  pricePerLiter: number;
  effectiveFrom: string;
  updatedBy: string;
}[] = [];
