export const DEPOT = "Central Depot, Karachi";

/** GPS coordinates for the configured demo company location (the depot). */
export const COMPANY_LOCATION = { lat: 24.8138, lng: 67.0298 };

export const CITIES = ["Karachi", "Lahore", "Islamabad", "Faisalabad", "Rawalpindi", "Multan"] as const;

/** Approximate city-center GPS coordinates, used as a default when a pump's exact address isn't geocoded. */
export const CITY_COORDS: Record<(typeof CITIES)[number], { lat: number; lng: number }> = {
  Karachi: { lat: 24.8607, lng: 67.0011 },
  Lahore: { lat: 31.5497, lng: 74.3436 },
  Islamabad: { lat: 33.6844, lng: 73.0479 },
  Faisalabad: { lat: 31.4187, lng: 73.0791 },
  Rawalpindi: { lat: 33.5651, lng: 73.0169 },
  Multan: { lat: 30.1575, lng: 71.5249 },
};

export const FUEL_TYPES = ["petrol", "diesel", "hi-octane"] as const;

export type FuelType = (typeof FUEL_TYPES)[number];

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  petrol: "Petrol",
  diesel: "Diesel",
  "hi-octane": "Hi-Octane",
};
