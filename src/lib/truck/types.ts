// Shared truck types. No server-only imports, so pages and API routes can both use them.

export const TRUCK_TYPES = ["long", "short"] as const;
export type TruckType = (typeof TRUCK_TYPES)[number];

export const TRUCK_TYPE_LABELS: Record<TruckType, { en: string; ur: string }> = {
  long: { en: "Long", ur: "لمبا" },
  short: { en: "Short", ur: "چھوٹا" },
};

export function isTruckType(value: unknown): value is TruckType {
  return typeof value === "string" && (TRUCK_TYPES as readonly string[]).includes(value);
}

// The stored status uses the values the admin assignment routes already write:
// "available" is Free, "in-transit" is Busy.
export type TruckAvailability = "free" | "busy";

export const TRUCK_STATUS_TO_AVAILABILITY: Record<string, TruckAvailability> = {
  available: "free",
  "in-transit": "busy",
};

// Orders that keep a truck busy until they are completed.
export const ACTIVE_TRIP_STATUSES = ["accepted", "dispatched", "on-the-way"] as const;

export interface TruckLocation {
  lat: number;
  lng: number;
  accuracy: number;
  at: string;
}

export interface TruckTripView {
  orderId: string;
  orderNumber: string;
  fuelType: "petrol" | "diesel";
  quantityLitres: number;
  pickupPump: string;
  destinationPump: string;
  orderStatus: string;
  requestedAt: string;
  expectedArrival: string;
  driverResponse: "pending" | "accepted" | "rejected";
  driverConfirmed: boolean;
}

export interface TruckView {
  id: string;
  driverName: string;
  phone: string;
  truckNumber: string;
  truckType: TruckType | "";
  username: string;
  pumpId: string;
  pumpName: string;
  availability: TruckAvailability;
  currentTrip: TruckTripView | null;
  location: TruckLocation | null;
  createdAt: string;
}

export interface TruckOrderView {
  orderId: string;
  orderNumber: string;
  fuelType: "petrol" | "diesel";
  quantityLitres: number;
  pickupPump: string;
  destinationPump: string;
  status: string;
  requestedAt: string;
  expectedArrival: string;
  deliveredAt: string;
  driverResponse: "pending" | "accepted" | "rejected";
  driverConfirmed: boolean;
}
