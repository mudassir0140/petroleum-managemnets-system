// Monthly khata ledger rules. Pure: no imports, so the tests and the client can use the same maths.
//
// The records are the source of truth:
//   - fuel lines (khataEntries, and the account's opening transaction), each dated
//   - payments (khataPayments), each with an amount and an allocation: which month's dues it pays
// Each month keeps its own record: its original dues (fuel dated in it), the payments allocated to it,
// and its remaining balance. A month's opening balance is the previous month's closing, so the unpaid
// balance of earlier months is carried forward and always visible. Nothing is stored as a running total.
//
// Payments that were recorded before allocations existed have no allocation list. They are allocated to
// the month they were dated in, up to that month's dues, in date order. Anything left over is credit.
//
// All money is kept in whole paisa while adding, and converted back to rupees at the end.

// Business dates are in Pakistan time (UTC+5, no daylight saving).
export const KHATA_UTC_OFFSET_MINUTES = 300;

export type MonthStatus = "pending" | "partially-paid" | "paid" | "closed";

export const MONTH_STATUS_LABELS: Record<MonthStatus, { en: string; ur: string }> = {
  pending: { en: "Unpaid", ur: "غیر ادا شدہ" },
  "partially-paid": { en: "Partially Paid", ur: "جزوی ادائیگی" },
  paid: { en: "Fully Paid", ur: "مکمل ادا" },
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

// One payment's allocation to one month of dues.
export interface PaymentAllocation {
  month: string;
  amount: number;
}

export interface LedgerPayment {
  date: string;
  amountReceived: number;
  advancePaid: number;
  // undefined or null: a legacy payment, allocated by its own date.
  allocations?: PaymentAllocation[] | null;
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
  // Unpaid balance carried in from earlier months (the previous month's closing).
  opening: number;
  // Original dues of this month: the fuel dated in it.
  fuel: number;
  // Payments allocated to this month's dues.
  payments: number;
  // Kept for the existing screens. Advances are part of the payment total now, so this is always 0.
  advances: number;
  // Credit from payments dated in this month that were not allocated to any dues.
  credit: number;
  // This month's own unpaid amount: original dues − allocated payments. Negative means over-allocated.
  remaining: number;
  // Opening + dues − allocated payments − credit. Negative means credit held for the customer.
  closing: number;
  status: MonthStatus;
  closed: boolean;
  closedSnapshot: ClosedSnapshot | null;
  // true when the live closing no longer matches the figures frozen at closing.
  changedAfterClose: boolean;
}

export interface LedgerInput {
  startMonth: string;
  endMonth: string;
  fuel: LedgerFuelLine[];
  payments: LedgerPayment[];
  closed: Map<string, ClosedSnapshot>;
}

// Allocates payment amounts to the dues that are still unpaid, in month order, oldest first.
// `dues` is every month with its remaining unpaid amount. Anything not allocated is returned as credit.
export function allocateOldestFirst(dues: Array<{ month: string; remaining: number }>, amount: number): { allocations: PaymentAllocation[]; unallocated: number } {
  let left = toPaisa(amount);
  const allocations: PaymentAllocation[] = [];
  for (const due of [...dues].sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0))) {
    const owed = toPaisa(due.remaining);
    if (owed <= 0 || left <= 0) continue;
    const take = Math.min(owed, left);
    allocations.push({ month: due.month, amount: fromPaisa(take) });
    left -= take;
  }
  return { allocations, unallocated: fromPaisa(left) };
}

// Checks manual allocations: each month must have unpaid dues, no month may be allocated more than it owes,
// and the allocations may not add up to more than the payment.
export function validateManualAllocation(
  dues: Array<{ month: string; remaining: number }>,
  allocations: PaymentAllocation[],
  amount: number
): { ok: true; unallocated: number } | { ok: false; error: string } {
  const owedBy = new Map(dues.map((d) => [d.month, toPaisa(d.remaining)]));
  const takenBy = new Map<string, number>();
  let total = 0;
  for (const a of allocations) {
    const paisa = toPaisa(a.amount);
    if (paisa <= 0) return { ok: false, error: `Enter an amount greater than 0 for ${a.month}` };
    const owed = owedBy.get(a.month);
    if (owed === undefined || owed <= 0) return { ok: false, error: `${a.month} has no unpaid dues to allocate to` };
    const taken = (takenBy.get(a.month) ?? 0) + paisa;
    if (taken > owed) return { ok: false, error: `${a.month} owes only ${fromPaisa(owed).toFixed(2)}, so allocate no more than that` };
    takenBy.set(a.month, taken);
    total += paisa;
  }
  if (total > toPaisa(amount)) return { ok: false, error: "The allocations add up to more than the payment" };
  return { ok: true, unallocated: fromPaisa(toPaisa(amount) - total) };
}

// Builds every month from startMonth to endMonth. The first month's opening balance is 0, because the
// account's opening transaction is itself one of the fuel lines.
export function buildLedger(input: LedgerInput): MonthRow[] {
  const duesBy = new Map<string, number>();
  for (const line of input.fuel) {
    const key = monthKeyOf(line.date);
    if (!key) continue;
    duesBy.set(key, (duesBy.get(key) ?? 0) + toPaisa(line.amount));
  }

  const allocatedBy = new Map<string, number>();
  const creditBy = new Map<string, number>();
  const legacy: Array<{ date: string; total: number }> = [];

  for (const payment of input.payments) {
    const total = toPaisa(payment.amountReceived) + toPaisa(payment.advancePaid);
    if (payment.allocations === undefined || payment.allocations === null) {
      legacy.push({ date: payment.date, total });
      continue;
    }
    let used = 0;
    for (const allocation of payment.allocations) {
      const paisa = toPaisa(allocation.amount);
      if (paisa <= 0) continue;
      allocatedBy.set(allocation.month, (allocatedBy.get(allocation.month) ?? 0) + paisa);
      used += paisa;
    }
    const key = monthKeyOf(payment.date);
    const credit = Math.max(0, total - used);
    if (key && credit > 0) creditBy.set(key, (creditBy.get(key) ?? 0) + credit);
  }

  // Legacy payments: each is applied to its own month's dues that are still open, in date order.
  legacy.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  for (const payment of legacy) {
    const key = monthKeyOf(payment.date);
    if (!key) continue;
    const owed = (duesBy.get(key) ?? 0) - (allocatedBy.get(key) ?? 0);
    const take = Math.max(0, Math.min(payment.total, owed));
    if (take > 0) allocatedBy.set(key, (allocatedBy.get(key) ?? 0) + take);
    const credit = payment.total - take;
    if (credit > 0) creditBy.set(key, (creditBy.get(key) ?? 0) + credit);
  }

  const rows: MonthRow[] = [];
  let openingPaisa = 0;
  for (const month of monthRange(input.startMonth, input.endMonth)) {
    const duesPaisa = duesBy.get(month) ?? 0;
    const allocatedPaisa = allocatedBy.get(month) ?? 0;
    const creditPaisa = creditBy.get(month) ?? 0;
    const remainingPaisa = duesPaisa - allocatedPaisa;
    const closingPaisa = openingPaisa + duesPaisa - allocatedPaisa - creditPaisa;

    const snapshot = input.closed.get(month) ?? null;
    const status: MonthStatus = snapshot
      ? "closed"
      : remainingPaisa <= 0
        ? "paid"
        : allocatedPaisa > 0
          ? "partially-paid"
          : "pending";

    rows.push({
      month,
      opening: fromPaisa(openingPaisa),
      fuel: fromPaisa(duesPaisa),
      payments: fromPaisa(allocatedPaisa),
      advances: 0,
      credit: fromPaisa(creditPaisa),
      remaining: fromPaisa(remainingPaisa),
      closing: fromPaisa(closingPaisa),
      status,
      closed: snapshot !== null,
      closedSnapshot: snapshot,
      changedAfterClose: snapshot !== null && toPaisa(snapshot.closing) !== closingPaisa,
    });
    openingPaisa = closingPaisa;
  }
  return rows;
}

// The breakdown of every month that still has unpaid dues, with the totals. Each month stays its own line.
export function duesBreakdown(rows: MonthRow[]): {
  months: Array<{ month: string; originalDues: number; paymentsReceived: number; remaining: number; status: MonthStatus }>;
  grossOutstanding: number;
  unallocatedCredit: number;
  netBalance: number;
} {
  let gross = 0;
  let credit = 0;
  let net = 0;
  const months = [];
  for (const row of rows) {
    const remaining = toPaisa(row.remaining);
    net += remaining - toPaisa(row.credit);
    credit += toPaisa(row.credit);
    if (remaining > 0) {
      gross += remaining;
      months.push({ month: row.month, originalDues: row.fuel, paymentsReceived: row.payments, remaining: row.remaining, status: row.status });
    }
  }
  return { months, grossOutstanding: fromPaisa(gross), unallocatedCredit: fromPaisa(credit), netBalance: fromPaisa(net) };
}

// Months that are over (before the current month), still open, and carry any figures. These need a review.
export function monthsNeedingReview(rows: MonthRow[], currentMonth: string): MonthRow[] {
  return rows.filter(
    (row) => row.month < currentMonth && !row.closed && (row.opening !== 0 || row.fuel !== 0 || row.payments !== 0 || row.credit !== 0)
  );
}

// Closing is allowed only for a month that is over. The current month cannot be closed yet.
export function canCloseMonth(month: string, currentMonth: string): { ok: true } | { ok: false; error: string } {
  if (month >= currentMonth) return { ok: false, error: "Only a month that is over can be closed. The current month closes after it ends." };
  return { ok: true };
}

// A payment can only be dated in a month that is still open.
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
