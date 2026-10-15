// PKR helpers for the supplier request form, the supplier dashboard and the API.
// Every helper accepts undefined, null or junk input, so a missing value shows "—"
// instead of crashing (no .toFixed() on values that may be missing).

export function toPkrNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : undefined;
}

export function formatPkr(value: unknown): string {
  const n = toPkrNumber(value);
  return n === undefined ? "—" : `PKR ${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

// Amount = litres x offered rate, rounded to paisa. Undefined when either input is missing.
export function calcAmount(litres: unknown, offeredRate: unknown): number | undefined {
  const l = toPkrNumber(litres);
  const r = toPkrNumber(offeredRate);
  if (l === undefined || r === undefined) return undefined;
  return Math.round(l * r * 100) / 100;
}
