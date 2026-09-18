import { getStorageService } from "./localStorage-service";
import type { ShiftLog, SaleEntry, ClosingReport } from "@/lib/attendant/types";
import type { Shift } from "@/lib/types";

const SHIFTS_COLLECTION = "shift_logs";
const SALES_COLLECTION = "sale_entries";
const CLOSINGS_COLLECTION = "closing_reports";

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export class ShiftError extends Error {}

// Shift Log operations
export async function startShift(
  attendantId: string,
  pumpId: string,
  shift: Shift
): Promise<ShiftLog> {
  const service = getStorageService();
  const existing = service.findOne(
    SHIFTS_COLLECTION,
    (item: any) => item.attendantId === attendantId && item.status === "active"
  );
  if (existing) return existing as any;

  const log: ShiftLog = {
    id: generateId("SHF"),
    attendantId,
    pumpId,
    shift,
    date: isoDate(new Date()),
    status: "active",
    startedAt: new Date().toISOString(),
  };
  service.create(SHIFTS_COLLECTION, {
    ...log,
    id: log.id,
  });
  return log;
}

export async function getActiveShift(attendantId: string): Promise<ShiftLog | null> {
  const service = getStorageService();
  const data = service.findOne(
    SHIFTS_COLLECTION,
    (item: any) => item.attendantId === attendantId && item.status === "active"
  );
  return data ? (data as any) : null;
}

export async function getShiftLog(shiftLogId: string): Promise<ShiftLog | null> {
  const service = getStorageService();
  const data = service.read(SHIFTS_COLLECTION, shiftLogId);
  return data ? (data as any) : null;
}

export async function getShiftHistory(attendantId: string, limit = 30): Promise<ShiftLog[]> {
  const service = getStorageService();
  return service
    .query(SHIFTS_COLLECTION, (item: any) => item.attendantId === attendantId)
    .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))
    .slice(0, limit) as any[];
}

export async function closeShift(shiftLogId: string, endedAt: string): Promise<ShiftLog | null> {
  const service = getStorageService();
  return service.update(SHIFTS_COLLECTION, shiftLogId, {
    status: "closed",
    endedAt,
  }) as any;
}

// Sales Entry operations
export interface RecordSaleInput {
  attendantId: string;
  fuel: "petrol" | "diesel";
  litres: number;
  paymentMethod: "cash" | "card";
}

export async function recordSale(
  shiftLogId: string,
  input: RecordSaleInput,
  unitPrice: number
): Promise<SaleEntry> {
  const service = getStorageService();

  const amount = Math.round(input.litres * unitPrice * 100) / 100;

  const entry: SaleEntry = {
    id: generateId("SALE"),
    shiftLogId,
    attendantId: input.attendantId,
    pumpId: "", // Will be set from shift context
    fuel: input.fuel,
    litres: input.litres,
    unitPrice,
    amount,
    paymentMethod: input.paymentMethod,
    recordedAt: new Date().toISOString(),
  };

  service.create(SALES_COLLECTION, {
    ...entry,
    id: entry.id,
  });
  return entry;
}

export async function getSalesForShift(shiftLogId: string): Promise<SaleEntry[]> {
  const service = getStorageService();
  return service
    .query(SALES_COLLECTION, (item: any) => item.shiftLogId === shiftLogId)
    .sort((a, b) => (a.recordedAt < b.recordedAt ? 1 : -1)) as any[];
}

export async function getDailySalesHistory(
  attendantId: string,
  days: number
): Promise<Array<{
  date: string;
  petrolLitres: number;
  dieselLitres: number;
  cashTotal: number;
  cardTotal: number;
  revenueTotal: number;
}>> {
  const service = getStorageService();
  const byDate = new Map<
    string,
    {
      date: string;
      petrolLitres: number;
      dieselLitres: number;
      cashTotal: number;
      cardTotal: number;
      revenueTotal: number;
    }
  >();

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffIso = isoDate(cutoff);

  const entries = service.query(
    SALES_COLLECTION,
    (item: any) => item.attendantId === attendantId
  ) as any[];

  for (const entry of entries) {
    const date = entry.recordedAt.slice(0, 10);
    if (date < cutoffIso) continue;

    const bucket = byDate.get(date) || {
      date,
      petrolLitres: 0,
      dieselLitres: 0,
      cashTotal: 0,
      cardTotal: 0,
      revenueTotal: 0,
    };
    if (entry.fuel === "petrol") bucket.petrolLitres += entry.litres;
    else bucket.dieselLitres += entry.litres;
    if (entry.paymentMethod === "cash") bucket.cashTotal += entry.amount;
    else bucket.cardTotal += entry.amount;
    bucket.revenueTotal += entry.amount;
    byDate.set(date, bucket);
  }

  return Array.from(byDate.values()).sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getTodaySalesSummary(
  attendantId: string
): Promise<{
  date: string;
  petrolLitres: number;
  dieselLitres: number;
  cashTotal: number;
  cardTotal: number;
  revenueTotal: number;
}> {
  const today = isoDate(new Date());
  const history = await getDailySalesHistory(attendantId, 1);
  return (
    history.find((d) => d.date === today) || {
      date: today,
      petrolLitres: 0,
      dieselLitres: 0,
      cashTotal: 0,
      cardTotal: 0,
      revenueTotal: 0,
    }
  );
}

// Closing Report operations
export interface SubmitClosingReportInput {
  attendantId: string;
  cashCounted: number;
  notes: string;
}

export async function submitClosingReport(
  shiftLogId: string,
  pumpId: string,
  input: SubmitClosingReportInput,
  totals: any
): Promise<ClosingReport> {
  const service = getStorageService();

  const report: ClosingReport = {
    id: generateId("RPT"),
    shiftLogId,
    attendantId: input.attendantId,
    pumpId,
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

  service.create(CLOSINGS_COLLECTION, {
    ...report,
    id: report.id,
  });

  // Close the shift
  await closeShift(shiftLogId, report.submittedAt);

  return report;
}

export async function getClosingReportForShift(
  shiftLogId: string
): Promise<ClosingReport | null> {
  const service = getStorageService();
  const data = service.findOne(
    CLOSINGS_COLLECTION,
    (item: any) => item.shiftLogId === shiftLogId
  );
  return data ? (data as any) : null;
}

export async function getClosingReportHistory(
  attendantId: string,
  limit = 30
): Promise<ClosingReport[]> {
  const service = getStorageService();
  return service
    .query(CLOSINGS_COLLECTION, (item: any) => item.attendantId === attendantId)
    .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1))
    .slice(0, limit) as any[];
}
