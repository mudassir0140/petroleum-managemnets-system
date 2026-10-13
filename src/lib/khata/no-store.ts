// Khata reads must always hit MongoDB. Routes that use this also export
// `dynamic = "force-dynamic"` and `revalidate = 0` (route segment config
// must be declared in each route file, so it cannot live here).
export const KHATA_NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

// Fuel amount for an entry: stored amount when present, otherwise litres × given rate.
export function entryAmount(entry: { amount?: number; litres?: number; givenRate?: number }): number {
  if (typeof entry.amount === "number" && !Number.isNaN(entry.amount)) return entry.amount;
  return (entry.litres || 0) * (entry.givenRate || 0);
}
