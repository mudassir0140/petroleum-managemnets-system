export const DEPOT = "Central Depot, Karachi";

export const CITIES = ["Karachi", "Lahore", "Islamabad", "Faisalabad", "Rawalpindi", "Multan"] as const;

export const FUEL_TYPES = ["petrol", "diesel", "hi-octane"] as const;

export type FuelType = (typeof FUEL_TYPES)[number];

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  petrol: "Petrol",
  diesel: "Diesel",
  "hi-octane": "Hi-Octane",
};
