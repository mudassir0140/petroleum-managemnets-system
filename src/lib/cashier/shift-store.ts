import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";
import type { CashHandover, CashierShift, CashierShiftTotals, CashierTransaction, DailyCashSummary, TransactionCategory } from "@/lib/cashier/types";
import type { PaymentMethod, Shift } from "@/lib/types";

// File-backed ledger of cashier shifts, customer transactions and shift
// handovers. Everything here is read/written scoped to a single cashierId —
// callers (Server Actions, pages) always derive cashierId from the verified
// session, never from client input, so a cashier can only ever start, close
// or log transactions against their OWN shifts.
interface StoreShape {
  shifts: CashierShift[];
  transactions: CashierTransaction[];
  handovers: CashHandover[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "cashier-shifts.json");

function emptyStore(): StoreShape {
  return { shifts: [], transactions: [], handovers: [] };
}

function load(): StoreShape {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE_PATH)) {
    const seeded = emptyStore();
    fs.writeFileSync(FILE_PATH, JSON.stringify(seeded, null, 2), "utf8");
    return seeded;
  }
  try {
    const raw = fs.readFileSync(FILE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return {
      shifts: Array.isArray(parsed.shifts) ? parsed.shifts : [],
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
      handovers: Array.isArray(parsed.handovers) ? parsed.handovers : [],
    };
  } catch {
    return emptyStore();
  }
}

const store: StoreShape = load();

function persist() {
  fs.writeFileSync(FILE_PATH, JSON.stringify(store, null, 2), "utf8");
}

function generateId(prefix: string): string {
  return `${prefix}-${randomBytes(5).toString("hex")}`;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export class CashierShiftError extends Error {}

export function getActiveShift(cashierId: string): CashierShift | null {
  return store.shifts.find((s) => s.cashierId === cashierId && s.status === "active") ?? null;
}

export function startShift(cashierId: string, pumpId: string, shift: Shift): CashierShift {
  const existing = getActiveShift(cashierId);
  if (existing) return existing;

  const log: CashierShift = {
    id: generateId("CSHF"),
    cashierId,
    pumpId,
    shift,
    date: isoDate(new Date()),
    status: "active",
    startedAt: new Date().toISOString(),
  };
  store.shifts.push(log);
  persist();
  return log;
}

export function getShift(shiftId: string): CashierShift | null {
  return store.shifts.find((s) => s.id === shiftId) ?? null;
}

export interface RecordTransactionInput {
  cashierId: string;
  category: TransactionCategory;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
}

export function recordTransaction(input: RecordTransactionInput): CashierTransaction {
  const shift = getActiveShift(input.cashierId);
  if (!shift) {
    throw new CashierShiftError("Start your shift before recording a transaction.");
  }
  if (input.amount <= 0) {
    throw new CashierShiftError("Amount must be greater than zero.");
  }

  const entry: CashierTransaction = {
    id: generateId("TXN"),
    shiftId: shift.id,
    cashierId: input.cashierId,
    pumpId: shift.pumpId,
    category: input.category,
    description: input.description.trim(),
    amount: Math.round(input.amount * 100) / 100,
    paymentMethod: input.paymentMethod,
    recordedAt: new Date().toISOString(),
  };
  store.transactions.push(entry);
  persist();
  return entry;
}

export function getTransactionsForShift(shiftId: string): CashierTransaction[] {
  return store.transactions.filter((t) => t.shiftId === shiftId).sort((a, b) => (a.recordedAt < b.recordedAt ? 1 : -1));
}

export function computeShiftTotals(shiftId: string): CashierShiftTotals {
  const entries = store.transactions.filter((t) => t.shiftId === shiftId);
  return entries.reduce<CashierShiftTotals>(
    (acc, e) => ({
      cashTotal: acc.cashTotal + (e.paymentMethod === "cash" ? e.amount : 0),
      cardTotal: acc.cardTotal + (e.paymentMethod === "card" ? e.amount : 0),
      revenueTotal: acc.revenueTotal + e.amount,
      transactionCount: acc.transactionCount + 1,
    }),
    { cashTotal: 0, cardTotal: 0, revenueTotal: 0, transactionCount: 0 },
  );
}

export interface SubmitHandoverInput {
  cashierId: string;
  cashCounted: number;
  handoverTo: string;
  notes: string;
}

export function submitHandover(input: SubmitHandoverInput): CashHandover {
  const shift = getActiveShift(input.cashierId);
  if (!shift) {
    throw new CashierShiftError("There is no active shift to reconcile.");
  }

  const totals = computeShiftTotals(shift.id);
  const handover: CashHandover = {
    id: generateId("HO"),
    shiftId: shift.id,
    cashierId: input.cashierId,
    pumpId: shift.pumpId,
    cashExpected: totals.cashTotal,
    cashCounted: input.cashCounted,
    variance: Math.round((input.cashCounted - totals.cashTotal) * 100) / 100,
    cardTotal: totals.cardTotal,
    revenueTotal: totals.revenueTotal,
    transactionCount: totals.transactionCount,
    handoverTo: input.handoverTo.trim(),
    notes: input.notes.trim(),
    submittedAt: new Date().toISOString(),
  };
  store.handovers.push(handover);

  shift.status = "closed";
  shift.endedAt = handover.submittedAt;

  persist();
  return handover;
}

export function getShiftHistory(cashierId: string, limit = 30): CashierShift[] {
  return store.shifts
    .filter((s) => s.cashierId === cashierId)
    .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))
    .slice(0, limit);
}

export function getHandoverForShift(shiftId: string): CashHandover | null {
  return store.handovers.find((h) => h.shiftId === shiftId) ?? null;
}

export function getHandoverHistory(cashierId: string, limit = 30): CashHandover[] {
  return store.handovers
    .filter((h) => h.cashierId === cashierId)
    .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1))
    .slice(0, limit);
}

export function getTransactionHistory(cashierId: string, limit = 200): CashierTransaction[] {
  return store.transactions
    .filter((t) => t.cashierId === cashierId)
    .sort((a, b) => (a.recordedAt < b.recordedAt ? 1 : -1))
    .slice(0, limit);
}

export function getDailyCashHistory(cashierId: string, days: number): DailyCashSummary[] {
  const byDate = new Map<string, DailyCashSummary>();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffIso = isoDate(cutoff);

  for (const entry of store.transactions) {
    if (entry.cashierId !== cashierId) continue;
    const date = entry.recordedAt.slice(0, 10);
    if (date < cutoffIso) continue;

    const bucket = byDate.get(date) ?? { date, cashTotal: 0, cardTotal: 0, revenueTotal: 0, transactionCount: 0 };
    if (entry.paymentMethod === "cash") bucket.cashTotal += entry.amount;
    else bucket.cardTotal += entry.amount;
    bucket.revenueTotal += entry.amount;
    bucket.transactionCount += 1;
    byDate.set(date, bucket);
  }

  return Array.from(byDate.values()).sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getTodayCashSummary(cashierId: string): DailyCashSummary {
  const today = isoDate(new Date());
  const history = getDailyCashHistory(cashierId, 1);
  return history.find((d) => d.date === today) ?? { date: today, cashTotal: 0, cardTotal: 0, revenueTotal: 0, transactionCount: 0 };
}
