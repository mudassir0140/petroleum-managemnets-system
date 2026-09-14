"use client";

import { FUEL_PRICE_SEED } from "@/lib/data/fuel-prices";
import { useSharedState } from "@/lib/store/shared-store";
import type { FuelPriceState } from "@/lib/manager/types";

/**
 * Single source of truth for fuel prices, set by the Company Owner and read
 * live by the Company Manager (and, in turn, every Pump Owner) - no separate
 * price system, everyone reads this same shared store.
 */
export function useFuelPrices() {
  return useSharedState<FuelPriceState>("fuel-prices", FUEL_PRICE_SEED);
}
