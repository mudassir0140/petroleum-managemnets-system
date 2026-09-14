import type { FuelType, PaymentMethod, Shift } from "@/lib/types";

export type ShiftLogStatus = "active" | "closed";

export interface AttendantAccount {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  username: string;
  pumpId: string;
  assignedShift: Shift;
  passwordHash: string;
  createdAt: string;
}

export interface AttendantSession {
  attendantId: string;
  attendantName: string;
  attendantEmail: string;
  pumpId: string;
  assignedShift: Shift;
  role: "attendant";
}

export interface ShiftLog {
  id: string;
  attendantId: string;
  pumpId: string;
  shift: Shift;
  date: string; // ISO date the shift was started on
  status: ShiftLogStatus;
  startedAt: string;
  endedAt?: string;
}

export interface SaleEntry {
  id: string;
  shiftLogId: string;
  attendantId: string;
  pumpId: string;
  fuel: FuelType;
  litres: number;
  unitPrice: number;
  amount: number;
  paymentMethod: PaymentMethod;
  recordedAt: string;
}

export interface ShiftTotals {
  petrolLitres: number;
  dieselLitres: number;
  cashTotal: number;
  cardTotal: number;
  revenueTotal: number;
  transactionCount: number;
}

export interface ClosingReport {
  id: string;
  shiftLogId: string;
  attendantId: string;
  pumpId: string;
  petrolLitres: number;
  dieselLitres: number;
  cashTotal: number;
  cardTotal: number;
  revenueTotal: number;
  cashCounted: number;
  variance: number;
  notes: string;
  submittedAt: string;
}

export interface DailySalesSummary {
  date: string;
  petrolLitres: number;
  dieselLitres: number;
  cashTotal: number;
  cardTotal: number;
  revenueTotal: number;
}
