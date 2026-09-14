import type { FuelPriceState } from "@/lib/manager/types";

export const FUEL_PRICE_SEED: FuelPriceState = {
  prices: [
    { product: "Petrol", pricePerLiter: 106.48, change: 0.32 },
    { product: "Diesel", pricePerLiter: 94.21, change: -0.15 },
    { product: "Premium / Power Petrol", pricePerLiter: 112.85, change: 0.45 },
  ],
  updatedAt: "Today, 07:00 AM",
  updatedBy: "Rajesh Kapoor · Company Owner",
};

export const FUEL_PRICE_HISTORY_SEED: {
  id: string;
  product: string;
  pricePerLiter: number;
  effectiveFrom: string;
  updatedBy: string;
}[] = [
  { id: "fp-h1", product: "Petrol", pricePerLiter: 106.48, effectiveFrom: "Today, 07:00 AM", updatedBy: "Rajesh Kapoor" },
  { id: "fp-h2", product: "Diesel", pricePerLiter: 94.21, effectiveFrom: "Today, 07:00 AM", updatedBy: "Rajesh Kapoor" },
  { id: "fp-h3", product: "Premium / Power Petrol", pricePerLiter: 112.85, effectiveFrom: "Today, 07:00 AM", updatedBy: "Rajesh Kapoor" },
  { id: "fp-h4", product: "Petrol", pricePerLiter: 106.16, effectiveFrom: "Yesterday, 07:00 AM", updatedBy: "Rajesh Kapoor" },
  { id: "fp-h5", product: "Diesel", pricePerLiter: 94.36, effectiveFrom: "Yesterday, 07:00 AM", updatedBy: "Rajesh Kapoor" },
  { id: "fp-h6", product: "Petrol", pricePerLiter: 105.9, effectiveFrom: "8 Sep 2026, 07:00 AM", updatedBy: "Rajesh Kapoor" },
];
