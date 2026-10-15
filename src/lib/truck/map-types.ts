// Shared map and live-trip types. No server-only imports, so the dashboards and the API can both use them.
import type { GpsState, TripStage } from "./gps";

export interface MapPoint {
  lat: number;
  lng: number;
}

export interface MapStop {
  label: string;
  // null when no saved coordinates exist and the address could not be found: shown as "Location unavailable".
  point: MapPoint | null;
}

export interface TruckMapRoute {
  // [lat, lng] pairs for drawing.
  geometry: [number, number][];
  distanceKm: number;
  durationMin: number;
  // "road" comes from OSRM. "straight-line" is the fallback, and its time is an estimate.
  source: "road" | "straight-line";
  // "truck": the remaining route from the driver's live position. "start": no live position yet.
  from: "truck" | "start";
}

export interface TruckMapTrip {
  orderId: string;
  orderNumber: string;
  source: "order" | "supplier";
  pickupCompany: string;
  destinationPump: string;
  fuelType: string;
  quantityLitres: number;
  stage: TripStage;
  arrivedAt: string;
  arrivalSource: "gps" | "driver" | "";
  expectedArrival: string;
}

export interface TruckMapData {
  // true while the truck has an active delivery.
  active: boolean;
  // Access fields: the owner pump of the truck, and the pump the delivery goes to.
  truckPumpId: string;
  destinationPumpId: string;
  start: MapStop;
  destination: MapStop;
  trip: TruckMapTrip | null;
  gps: {
    state: GpsState;
    ageSeconds: number | null;
    accuracyM: number | null;
  };
  truck: {
    point: MapPoint | null;
    // true when the driver has not shared a position yet, so the marker sits at the start.
    atStart: boolean;
    updatedAt: string;
  };
  route: TruckMapRoute | null;
}
