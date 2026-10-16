// Monthly khata ledger rules. Pure: no imports, so the tests and the client can use the same maths.
//
// The source of truth is the dated records: fuel lines (khataEntries, plus the account's opening
// transaction) and payments (khataPayments). Each month is computed from the records dated in it, and
// its opening balance is the previous month's closing balance. Nothing is carried as a stored
// running total, so a late or edited record can never be counted twice or lost.
//
// All money is kept in whole paisa while adding, and converted back to rupees at the end.

// Business dates are in Pakistan time (UTC+5, no daylight saving).
export const KHATA_UTC_OFFSET_MINUTES = 300;

export type MonthStatus = "pending" | "partially-paid" | "paid" | "closed";

export const MONTH_STATUS_LABELS: Record<MonthStatus, { en: string; ur: string }> = {
  pending: { en: "Pending", ur: "زیرِ التوا" },
  "partially-paid": { en: "Partially Paid", ur: "جزوی ادائیگی" },
  paid: { en: "Paid in full (not closed)", ur: "مکمل ادا (بند نہیں)" },
  closed: { en: "Closed", ur: "بند" },
};

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

// "YYYY-MM" for a date-only string ("2026-10-01"), an ISO timestamp or a Date, in Pakistan time.
export function monthKeyOf(value: string | Date): string {
  if (typeof value === "string" && DATE_ONLY.test(value)) return value.slice(0, 7);
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  if (!Number.isFinite(time)) return "";
  const local = new Date(time + KHATA_UTC_OFFSET_MINUTES * 60 * 1000);
  return `${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function isMonthKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

// The month `delta` months after `key`, with the year rolling over correctly.
export function addMonths(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  const index = y * 12 + (m - 1) + delta;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

// Every month from `from` to `to`, both included. Empty when `from` is after `to`.
export function monthRange(from: string, to: string): string[] {
  const months: string[] = [];
  for (let key = from; key <= to; key = addMonths(key, 1)) {
    months.push(key);
    if (months.length > 1200) break; // guard against a bad date ever looping
  }
  return months;
}

// Whole paisa from any value. Missing or non-numeric values count as 0.
export function toPaisa(value: unknown): number {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? ""));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export function fromPaisa(paisa: number): number {
  return Math.round(paisa) / 100;
}

export interface LedgerFuelLine {
  date: string;
  amount: number;
}

export interface LedgerPayment {
  date: string;
  amountReceived: number;
  advancePaid: number;
}

// The figures frozen when a month was closed.
export interface ClosedSnapshot {
  opening: number;
  fuel: number;
  payments: number;
  advances: number;
  closing: number;
}

export interface MonthRow {
  month: string;
  opening: number;
  fuel: number;
  payments: number;
  advances: number;
  // Opening + fuel − payments − advances. Negative means credit held for the customer.
  closing: number;
  status: MonthStatus;
  closed: boolean;
  closedSnapshot: ClosedSnapshot | null;
  // true when the live figures no longer match the figures frozen at closing.
  changedAfterClose: boolean;
}

export interface LedgerInput {
  startMonth: string;
  endMonth: string;
  fuel: LedgerFuelLine[];
  payments: LedgerPayment[];
  closed: Map<string, ClosedSnapshot>;
}

// Builds every month from startMonth to endMonth. The first month's opening balance is 0, because the
// account's opening transaction is itself one of the fuel lines.
export function buildLedger(input: LedgerInput): MonthRow[] {
  const fuelBy = new Map<string, number>();
  for (const line of input.fuel) {
    const key = monthKeyOf(line.date);
    if (!key) continue;
    fuelBy.set(key, (fuelBy.get(key) ?? 0) + toPaisa(line.amount));
  }
  const paidBy = new Map<string, number>();
  const advancesBy = new Map<string, number>();
  for (const payment of input.payments) {
    const key = monthKeyOf(payment.date);
    if (!key) continue;
    paidBy.set(key, (paidBy.get(key) ?? 0) + toPaisa(payment.amountReceived));
    advancesBy.set(key, (advancesBy.get(key) ?? 0) + toPaisa(payment.advancePaid));
  }

  const rows: MonthRow[] = [];
  let openingPaisa = 0;
  for (const month of monthRange(input.startMonth, input.endMonth)) {
    const fuelPaisa = fuelBy.get(month) ?? 0;
    const paymentsPaisa = paidBy.get(month) ?? 0;
    const advancesPaisa = advancesBy.get(month) ?? 0;
    const closingPaisa = openingPaisa + fuelPaisa - paymentsPaisa - advancesPaisa;

    const snapshot = input.closed.get(month) ?? null;
    const closed = snapshot !== null;
    const status: MonthStatus = closed
      ? "closed"
      : closingPaisa <= 0
        ? "paid"
        : paymentsPaisa + advancesPaisa > 0
          ? "partially-paid"
          : "pending";

    rows.push({
      month,
      opening: fromPaisa(openingPaisa),
      fuel: fromPaisa(fuelPaisa),
      payments: fromPaisa(paymentsPaisa),
      advances: fromPaisa(advancesPaisa),
      closing: fromPaisa(closingPaisa),
      status,
      closed,
      closedSnapshot: snapshot,
      changedAfterClose: snapshot !== null && toPaisa(snapshot.closing) !== closingPaisa,
    });
    openingPaisa = closingPaisa;
  }
  return rows;
}

// Months that are over (before the current month), still open, and carry any figures. These need a review.
export function monthsNeedingReview(rows: MonthRow[], currentMonth: string): MonthRow[] {
  return rows.filter(
    (row) => row.month < currentMonth && !row.closed && (row.opening !== 0 || row.fuel !== 0 || row.payments !== 0 || row.advances !== 0)
  );
}

// Closing is allowed only for a month that is over. The current month cannot be closed yet.
export function canCloseMonth(month: string, currentMonth: string): { ok: true } | { ok: false; error: string } {
  if (month >= currentMonth) return { ok: false, error: "Only a month that is over can be closed. The current month closes after it ends." };
  return { ok: true };
}

// A payment can only be recorded in a month that is still open.
export function canRecordIn(row: MonthRow | undefined): { ok: true } | { ok: false; error: string } {
  if (row?.closed) return { ok: false, error: "This month is closed. Edit it with confirmation instead." };
  return { ok: true };
}

// Totals across many accounts, in paisa, so the summary adds up exactly.
export function outstandingSummary(closings: number[]): { outstanding: number; credit: number; accountsWithDues: number } {
  let dues = 0;
  let credit = 0;
  let accounts = 0;
  for (const closing of closings) {
    const paisa = toPaisa(closing);
    if (paisa > 0) {
      dues += paisa;
      accounts += 1;
    } else if (paisa < 0) {
      credit += -paisa;
    }
  }
  return { outstanding: fromPaisa(dues), credit: fromPaisa(credit), accountsWithDues: accounts };
}

// The key that stops the same review notification from being created twice.
export function reviewNotificationKey(pumpId: string, clientId: string, month: string): string {
  return `khata-review:${pumpId}:${clientId}:${month}`;
}
