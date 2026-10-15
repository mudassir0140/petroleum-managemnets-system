import type { RouteResult } from "@/lib/truck/route";

// Draws the real OSRM route between the two pumps as a line. Coordinates come from the route only;
// nothing is estimated. There are no map tiles, so only the route itself is shown.
const WIDTH = 640;
const HEIGHT = 320;
const PAD = 28;

// caption replaces the default "From the pickup pump" line, for routes that start somewhere else (the supplier).
export function RouteSvg({
  route,
  caption,
}: {
  route: Pick<RouteResult, "geometry" | "origin" | "destination"> & { originSource?: RouteResult["originSource"] };
  caption?: string;
}) {
  const points = route.geometry;
  if (points.length < 2) return null;

  const lats = points.map(([lat]) => lat);
  const lngs = points.map(([, lng]) => lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);

  // Longitude degrees are narrower away from the equator, so scale them by cos(latitude).
  const meanLat = (minLat + maxLat) / 2;
  const xSpan = Math.max((maxLng - minLng) * Math.cos((meanLat * Math.PI) / 180), 1e-9);
  const ySpan = Math.max(maxLat - minLat, 1e-9);
  const scale = Math.min((WIDTH - 2 * PAD) / xSpan, (HEIGHT - 2 * PAD) / ySpan);

  const project = (lat: number, lng: number): [number, number] => {
    const x = PAD + (lng - minLng) * Math.cos((meanLat * Math.PI) / 180) * scale;
    const y = HEIGHT - PAD - (lat - minLat) * scale;
    return [x, y];
  };

  const line = points.map(([lat, lng]) => project(lat, lng).map((n) => n.toFixed(1)).join(",")).join(" ");
  const [ox, oy] = project(route.origin.lat, route.origin.lng);
  const [dx, dy] = project(route.destination.lat, route.destination.lng);

  return (
    <figure className="mt-3">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800" role="img" aria-label="Truck route">
        <polyline points={line} fill="none" stroke="currentColor" strokeWidth={3} className="text-amber-600" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={ox} cy={oy} r={6} className="fill-green-600" />
        <circle cx={dx} cy={dy} r={6} className="fill-red-600" />
        <text x={ox + 10} y={oy - 8} className="fill-slate-700 text-[12px] dark:fill-slate-200">Start / شروع</text>
        <text x={dx + 10} y={dy - 8} className="fill-slate-700 text-[12px] dark:fill-slate-200">End / منزل</text>
      </svg>
      <figcaption className="mt-1 text-xs text-slate-500">
        {caption ??
          `${route.originSource === "live-location" ? "From the truck's live location" : "From the pickup pump"} to the destination pump.`}
      </figcaption>
    </figure>
  );
}
