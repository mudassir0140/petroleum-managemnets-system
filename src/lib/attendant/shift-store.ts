import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";
import { getCurrentFuelPrice } from "@/lib/fuel-price-store";
import type { ClosingReport, DailySalesSummary, SaleEntry, ShiftLog, ShiftTotals } from "@/lib/attendant/types";
import type { FuelType, PaymentMethod, Shift } from "@/lib/types";

// File-backed ledger of shift lifecycle + fuel dispensing transactions.
// Everything here is read/written scoped to a single attendantId — callers
// (Server Actions, pages) always derive attendantId from the verified
// session, never from client input, so an attendant can only ever start,
// close or log sales against their OWN shifts.
interface StoreShape {
  shiftLogs: ShiftLog[];
  saleEntries: SaleEntry[];
  closingReports: ClosingReport[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "shift-logs.json");

function emptyStore(): StoreShape {
  return { shiftLogs: [], saleEntries: [], closingReports: [] };
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
      shiftLogs: Array.isArray(parsed.shiftLogs) ? parsed.shiftLogs : [],
      saleEntries: Array.isArray(parsed.saleEntries) ? parsed.saleEntries : [],
      closingReports: Array.isArray(parsed.closingReports) ? parsed.closingReports : [],
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

export class ShiftError extends Error {}

export function getActiveShift(attendantId: string): ShiftLog | null {
  return store.shiftLogs.find((s) => s.attendantId === attendantId && s.status === "active") ?? null;
}

export function startShift(attendantId: string, pumpId: string, shift: Shift): ShiftLog {
  const existing = getActiveShift(attendantId);
  if (existing) return existing;

  const log: ShiftLog = {
    id: generateId("SHF"),
    attendantId,
    pumpId,
    shift,
    date: isoDate(new Date()),
    status: "active",
    startedAt: new Date().toISOString(),
  };
  store.shiftLogs.push(log);
  persist();
  return log;
}

export function getShiftLog(shiftLogId: string): ShiftLog | null {
  return store.shiftLogs.find((s) => s.id === shiftLogId) ?? null;
}

export interface RecordSaleInput {
  attendantId: string;
  fuel: FuelType;
  litres: number;
  paymentMethod: PaymentMethod;
}

export function recordSale(input: RecordSaleInput): SaleEntry {
  const shiftLog = getActiveShift(input.attendantId);
  if (!shiftLog) {
    throw new ShiftError("Start your shift before logging a sale.");
  }
  if (input.litres <= 0) {
    throw new ShiftError("Litres must be greater than zero.");
  }

  const price = getCurrentFuelPrice();
  const unitPrice = input.fuel === "petrol" ? price.petrol : price.diesel;
  const amount = Math.round(input.litres * unitPrice * 100) / 100;

  const entry: SaleEntry = {
    id: generateId("SALE"),
    shiftLogId: shiftLog.id,
    attendantId: input.attendantId,
    pumpId: shiftLog.pumpId,
    fuel: input.fuel,
    litres: input.litres,
    unitPrice,
    amount,
    paymentMethod: input.paymentMethod,
    recordedAt: new Date().toISOString(),
  };
  store.saleEntries.push(entry);
  persist();
  return entry;
}

export function getSalesForShift(shiftLogId: string): SaleEntry[] {
  return store.saleEntries
    .filter((s) => s.shiftLogId === shiftLogId)
    .sort((a, b) => (a.recordedAt < b.recordedAt ? 1 : -1));
}

export function computeShiftTotals(shiftLogId: string): ShiftTotals {
  const entries = store.saleEntries.filter((s) => s.shiftLogId === shiftLogId);
  return entries.reduce<ShiftTotals>(
    (acc, e) => ({
      petrolLitres: acc.petrolLitres + (e.fuel === "petrol" ? e.litres : 0),
      dieselLitres: acc.dieselLitres + (e.fuel === "diesel" ? e.litres : 0),
      cashTotal: acc.cashTotal + (e.paymentMethod === "cash" ? e.amount : 0),
      cardTotal: acc.cardTotal + (e.paymentMethod === "card" ? e.amount : 0),
      revenueTotal: acc.revenueTotal + e.amount,
      transactionCount: acc.transactionCount + 1,
    }),
    { petrolLitres: 0, dieselLitres: 0, cashTotal: 0, cardTotal: 0, revenueTotal: 0, transactionCount: 0 },
  );
}

export interface SubmitClosingReportInput {
  attendantId: string;
  cashCounted: number;
  notes: string;
}

export function submitClosingReport(input: SubmitClosingReportInput): ClosingReport {
  const shiftLog = getActiveShift(input.attendantId);
  if (!shiftLog) {
    throw new ShiftError("There is no active shift to close.");
  }

  const totals = computeShiftTotals(shiftLog.id);
  const report: ClosingReport = {
    id: generateId("RPT"),
    shiftLogId: shiftLog.id,
    attendantId: input.attendantId,
    pumpId: shiftLog.pumpId,
    petrolLitres: totals.petrolLitres,
    dieselLitres: totals.dieselLitres,
    cashTotal: totals.cashTotal,
    cardTotal: totals.cardTotal,
    revenueTotal: totals.revenueTotal,
    cashCounted: input.cashCounted,
    variance: Math.round((input.cashCounted - totals.cashTotal) * 100) / 100,
    notes: input.notes.trim(),
    submittedAt: new Date().toISOString(),
  };
  store.closingReports.push(report);

  shiftLog.status = "closed";
  shiftLog.endedAt = report.submittedAt;

  persist();
  return report;
}

export function getShiftHistory(attendantId: string, limit = 30): ShiftLog[] {
  return store.shiftLogs
    .filter((s) => s.attendantId === attendantId)
    .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))
    .slice(0, limit);
}

export function getClosingReportForShift(shiftLogId: string): ClosingReport | null {
  return store.closingReports.find((r) => r.shiftLogId === shiftLogId) ?? null;
}

export function getClosingReportHistory(attendantId: string, limit = 30): ClosingReport[] {
  return store.closingReports
    .filter((r) => r.attendantId === attendantId)
    .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1))
    .slice(0, limit);
}

export function getDailySalesHistory(attendantId: string, days: number): DailySalesSummary[] {
  const byDate = new Map<string, DailySalesSummary>();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffIso = isoDate(cutoff);

  for (const entry of store.saleEntries) {
    if (entry.attendantId !== attendantId) continue;
    const date = entry.recordedAt.slice(0, 10);
    if (date < cutoffIso) continue;

    const bucket = byDate.get(date) ?? { date, petrolLitres: 0, dieselLitres: 0, cashTotal: 0, cardTotal: 0, revenueTotal: 0 };
    if (entry.fuel === "petrol") bucket.petrolLitres += entry.litres;
    else bucket.dieselLitres += entry.litres;
    if (entry.paymentMethod === "cash") bucket.cashTotal += entry.amount;
    else bucket.cardTotal += entry.amount;
    bucket.revenueTotal += entry.amount;
    byDate.set(date, bucket);
  }

  return Array.from(byDate.values()).sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getTodaySalesSummary(attendantId: string): DailySalesSummary {
  const today = isoDate(new Date());
  const history = getDailySalesHistory(attendantId, 1);
  return history.find((d) => d.date === today) ?? { date: today, petrolLitres: 0, dieselLitres: 0, cashTotal: 0, cardTotal: 0, revenueTotal: 0 };
}
