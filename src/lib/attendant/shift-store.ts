import {
  startShift as startShiftInStorage,
  getActiveShift as getActiveShiftInStorage,
  getShiftLog as getShiftLogInStorage,
  recordSale as recordSaleInStorage,
  getSalesForShift as getSalesForShiftInStorage,
  submitClosingReport as submitClosingReportInStorage,
  getShiftHistory as getShiftHistoryInStorage,
  getClosingReportForShift as getClosingReportForShiftInStorage,
  getClosingReportHistory as getClosingReportHistoryInStorage,
  getDailySalesHistory as getDailySalesHistoryInStorage,
  getTodaySalesSummary as getTodaySalesSummaryInStorage,
  ShiftError,
} from "@/lib/storage/shifts-storage";
import { getCurrentFuelPrice } from "@/lib/fuel-price-store";
import type { ClosingReport, DailySalesSummary, SaleEntry, ShiftLog, ShiftTotals } from "@/lib/attendant/types";
import type { FuelType, PaymentMethod, Shift } from "@/lib/types";

export { ShiftError };

export async function getActiveShift(attendantId: string): Promise<ShiftLog | null> {
  return getActiveShiftInStorage(attendantId);
}

export async function startShift(attendantId: string, pumpId: string, shift: Shift): Promise<ShiftLog> {
  return startShiftInStorage(attendantId, pumpId, shift);
}

export async function getShiftLog(shiftLogId: string): Promise<ShiftLog | null> {
  return getShiftLogInStorage(shiftLogId);
}

export interface RecordSaleInput {
  attendantId: string;
  fuel: FuelType;
  litres: number;
  paymentMethod: PaymentMethod;
}

export async function recordSale(input: RecordSaleInput): Promise<SaleEntry> {
  const shiftLog = await getActiveShift(input.attendantId);
  if (!shiftLog) {
    throw new ShiftError("Start your shift before logging a sale.");
  }
  if (input.litres <= 0) {
    throw new ShiftError("Litres must be greater than zero.");
  }

  const price = getCurrentFuelPrice();
  const unitPrice = input.fuel === "petrol" ? price.petrol : price.diesel;

  return recordSaleInStorage(shiftLog.id, input, unitPrice);
}

export async function getSalesForShift(shiftLogId: string): Promise<SaleEntry[]> {
  return getSalesForShiftInStorage(shiftLogId);
}

export async function computeShiftTotals(shiftLogId: string): Promise<ShiftTotals> {
  const entries = await getSalesForShift(shiftLogId);
  return entries.reduce<ShiftTotals>(
    (acc, e) => ({
      petrolLitres: acc.petrolLitres + (e.fuel === "petrol" ? e.litres : 0),
      dieselLitres: acc.dieselLitres + (e.fuel === "diesel" ? e.litres : 0),
      cashTotal: acc.cashTotal + (e.paymentMethod === "cash" ? e.amount : 0),
      cardTotal: acc.cardTotal + (e.paymentMethod === "card" ? e.amount : 0),
      revenueTotal: acc.revenueTotal + e.amount,
      transactionCount: acc.transactionCount + 1,
    }),
    {
      petrolLitres: 0,
      dieselLitres: 0,
      cashTotal: 0,
      cardTotal: 0,
      revenueTotal: 0,
      transactionCount: 0,
    }
  );
}

export interface SubmitClosingReportInput {
  attendantId: string;
  cashCounted: number;
  notes: string;
}

export async function submitClosingReport(input: SubmitClosingReportInput): Promise<ClosingReport> {
  const shiftLog = await getActiveShift(input.attendantId);
  if (!shiftLog) {
    throw new ShiftError("There is no active shift to close.");
  }

  const totals = await computeShiftTotals(shiftLog.id);
  return submitClosingReportInStorage(shiftLog.id, shiftLog.pumpId, input, totals);
}

export async function getShiftHistory(attendantId: string, limit = 30): Promise<ShiftLog[]> {
  return getShiftHistoryInStorage(attendantId, limit);
}

export async function getClosingReportForShift(shiftLogId: string): Promise<ClosingReport | null> {
  return getClosingReportForShiftInStorage(shiftLogId);
}

export async function getClosingReportHistory(attendantId: string, limit = 30): Promise<ClosingReport[]> {
  return getClosingReportHistoryInStorage(attendantId, limit);
}

export async function getDailySalesHistory(
  attendantId: string,
  days: number
): Promise<DailySalesSummary[]> {
  return getDailySalesHistoryInStorage(attendantId, days);
}

export async function getTodaySalesSummary(attendantId: string): Promise<DailySalesSummary> {
  return getTodaySalesSummaryInStorage(attendantId);
}
