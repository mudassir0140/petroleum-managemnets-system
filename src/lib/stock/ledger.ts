// Fuel stock for one pump and one fuel type, built from MongoDB records:
//   in  = litres on delivered fuel orders (dated by delivery)
//   out = litres sold in attendants' shifts (end meter reading minus start meter reading)
// No stored balance: every figure is derived from these two sources, so the
// dashboard, the stock cards and the month pages always agree.
// This file has no server imports, so pages and API routes can share it.

export const DELIVERED_ORDER_STATUSES = ["delivered", "completed", "payment-pending", "paid", "cleared"] as const;

export interface FuelReceipt {
  id: string;
  date: string; // YYYY-MM-DD (delivery date, Pakistan time)
  litres: number;
  status: string;
  trackingNumber?: string;
  driverName?: string;
}

export interface FuelLedger {
  receipts: FuelReceipt[];
  salesByDate: Record<string, number>; // YYYY-MM-DD -> litres sold that day
}

export interface StockDay {
  date: string;
  received: number;
  sold: number;
  closing: number;
}

export interface MonthStock {
  month: string; // YYYY-MM
  opening: number;
  closing: number;
  totalReceived: number;
  totalSold: number;
  receipts: FuelReceipt[];
  days: StockDay[];
  hasMovement: boolean;
}

const KARACHI_DAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit" });

// YYYY-MM-DD for a date, in Pakistan time, so an order delivered late at night
// lands on the same day the pump sees it.
export function dayKey(value: Date | string | number): string {
  const d = value instanceof Date ? value : new Date(value);
  return KARACHI_DAY.format(d);
}

export function toLitres(value: unknown): number {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? ""));
  return Number.isFinite(n) ? n : 0;
}

export function currentStock(ledger: FuelLedger): number {
  const received = ledger.receipts.reduce((sum, r) => sum + toLitres(r.litres), 0);
  const sold = Object.values(ledger.salesByDate).reduce((sum, l) => sum + toLitres(l), 0);
  return round(received - sold);
}

export function monthOf(value: Date | string): string {
  return dayKey(value).slice(0, 7);
}

export function currentMonth(): string {
  return dayKey(new Date()).slice(0, 7);
}

// Moves a YYYY-MM month by `delta` months.
export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function isValidMonth(value: string | undefined): value is string {
  return !!value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function monthStock(ledger: FuelLedger, month: string): MonthStock {
  const start = `${month}-01`;
  const next = shiftMonth(month, 1);
  const inMonth = (date: string) => date >= start && date < `${next}-01`;

  const receivedBefore = ledger.receipts.filter((r) => r.date < start).reduce((s, r) => s + toLitres(r.litres), 0);
  const soldBefore = Object.entries(ledger.salesByDate)
    .filter(([date]) => date < start)
    .reduce((s, [, l]) => s + toLitres(l), 0);
  const opening = round(receivedBefore - soldBefore);

  const receipts = ledger.receipts.filter((r) => inMonth(r.date)).sort((a, b) => a.date.localeCompare(b.date));

  const dayCount = daysInMonth(month);
  const days: StockDay[] = [];
  let running = opening;
  for (let i = 1; i <= dayCount; i++) {
    const date = `${month}-${String(i).padStart(2, "0")}`;
    const received = receipts.filter((r) => r.date === date).reduce((s, r) => s + toLitres(r.litres), 0);
    const sold = toLitres(ledger.salesByDate[date]);
    running = round(running + received - sold);
    days.push({ date, received: round(received), sold: round(sold), closing: running });
  }

  const totalReceived = round(receipts.reduce((s, r) => s + toLitres(r.litres), 0));
  const totalSold = round(days.reduce((s, d) => s + d.sold, 0));

  return {
    month,
    opening,
    closing: running,
    totalReceived,
    totalSold,
    receipts,
    days,
    hasMovement: receipts.length > 0 || totalSold > 0,
  };
}

export function daysInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

// "12,345.5 L", never a crash on undefined.
export function formatLitreValue(value: unknown): string {
  return `${toLitres(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })} L`;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
