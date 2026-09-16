// @ts-nocheck
import { PUMPS } from "@/lib/dashboard/data/pumps";
import type { FuelType } from "@/lib/dashboard/data/stations";

/** Cashier/attendant credited as the salesperson for each pump's records. */
export const PUMP_SALESPERSON: Record<number, string> = {
  1: "Saima Yousaf",
  2: "Zeeshan Aziz",
  3: "Hina Sultana",
  4: "Kamran Sheikh",
  5: "Farah Deeba",
  6: "Rabia Naz",
};

export type SaleRecord = {
  id: string;
  pumpNumber: number;
  pumpName: string;
  date: string;
  fuelType: FuelType;
  liters: number;
  revenue: number;
  salesperson: string;
};

export const SALE_RECORDS: SaleRecord[] = [];

export type PeriodPoint = {
  period?: string;
  label: string;
  amount?: number;
  liters: number;
  revenue: number;
};

export const DAILY_SALES: PeriodPoint[] = [];
export const WEEKLY_SALES: PeriodPoint[] = [];
export const MONTHLY_SALES: PeriodPoint[] = [];

export type SalesReport = {
  id: string;
  name: string;
  type: string;
  dateRange: string;
  pump: string;
  generatedBy: string;
  format: string;
  status: string;
  data?: unknown;
};

export type SalesTarget = {
  id: string;
  pumpNumber: number;
  pumpName: string;
  salesperson: string;
  month: string;
  target: number;
  achieved: number;
};

export type ReportType = {
  id: string;
  name: string;
  description: string;
  icon: string;
};

export const SALES_REPORTS: SalesReport[] = [];
export const SALES_REPORT_TYPES: ReportType[] = [];
export const SALES_TARGETS: SalesTarget[] = [];

export type PumpSalesTotals = {
  pumpNumber: number;
  pumpName: string;
  liters: number;
  revenue: number;
};

export function pumpSalesTotals(records?: SaleRecord[]): PumpSalesTotals[] {
  return [];
}
