// Shared map types. No server-only imports, so the map component and the API can both use them.

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
}

export interface TruckMapData {
  // true while the truck has an active delivery (an accepted supplier request or an active order trip).
  active: boolean;
  start: MapStop;
  destination: MapStop;
  truck: {
    point: MapPoint | null;
    // true when the driver has not shared a location yet, so the marker sits at the start.
    atStart: boolean;
    updatedAt: string;
  };
  route: TruckMapRoute | null;
}
