// Shared khata entry rules. No server-only imports here, so the API routes
// and the client components can use the same amount maths and formatting.

export type KhataFuelType = "Petrol" | "Diesel";

export interface KhataEntry {
  _id: string;
  khataClientId: string;
  pumpId: string;
  attendantId: string;
  attendantName: string;
  fuelType: string;
  litres: number;
  vehicleNumber: string;
  driverName: string;
  givenRate: number;
  amount: number;
  date: string;
  createdAt?: string;
  // Filled in by the attendant records list only.
  clientName?: string;
  status?: "Open" | "Closed";
}

// Any value (including undefined, null or "abc") becomes a finite number.
export function toSafeNumber(value: unknown): number {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? ""));
  return Number.isFinite(n) ? n : 0;
}

// amount = litres × given rate, rounded to paisa so every screen shows the same figure.
export function calcKhataAmount(litres: unknown, rate: unknown): number {
  return Math.round(toSafeNumber(litres) * toSafeNumber(rate) * 100) / 100;
}

// Always "1234.50", never a crash on undefined.
export function formatPkr(value: unknown): string {
  return toSafeNumber(value).toFixed(2);
}

export function normalizeFuelType(value: unknown): KhataFuelType | null {
  const v = String(value ?? "").trim().toLowerCase();
  if (v === "petrol") return "Petrol";
  if (v === "diesel") return "Diesel";
  return null;
}

// Accepts a Mongo document or a client-side account object.
export function givenRateFor(client: object, fuelType: string): number {
  const c = client as { petrolGivenRate?: unknown; dieselGivenRate?: unknown };
  return toSafeNumber(fuelType === "Diesel" ? c.dieselGivenRate : c.petrolGivenRate);
}

function toIsoOrEmpty(value: unknown): string {
  if (!value) return "";
  const d = new Date(value as string | number | Date);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

// Turns a khataEntries document into the JSON shape every screen reads.
// Works for ObjectId and string ids, and never throws on a missing field.
export function serializeKhataEntry(entry: any): KhataEntry {
  return {
    _id: String(entry._id ?? ""),
    khataClientId: String(entry.khataClientId ?? ""),
    pumpId: String(entry.pumpId ?? ""),
    attendantId: String(entry.attendantId ?? ""),
    attendantName: entry.attendantName || "",
    fuelType: entry.fuelType || "",
    litres: toSafeNumber(entry.litres),
    vehicleNumber: entry.vehicleNumber || "",
    driverName: entry.driverName || "",
    givenRate: toSafeNumber(entry.givenRate),
    amount: toSafeNumber(entry.amount),
    date: toIsoOrEmpty(entry.date),
    createdAt: toIsoOrEmpty(entry.createdAt) || undefined,
  };
}

// Sum of amounts for one khata's entries, rounded to paisa.
export function sumKhataAmounts(entries: Array<{ amount?: unknown }>): number {
  const total = entries.reduce((sum, e) => sum + toSafeNumber(e.amount), 0);
  return Math.round(total * 100) / 100;
}
