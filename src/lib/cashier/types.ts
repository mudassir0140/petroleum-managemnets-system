import type { PaymentMethod, Shift } from "@/lib/types";

export type CashierShiftStatus = "active" | "closed";
export type TransactionCategory = "fuel" | "shop" | "service" | "other";

export interface CashierAccount {
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

export interface CashierSession {
  cashierId: string;
  cashierName: string;
  cashierEmail: string;
  pumpId: string;
  assignedShift: Shift;
  role: "cashier";
}

export interface CashierShift {
  id: string;
  cashierId: string;
  pumpId: string;
  shift: Shift;
  date: string; // ISO date the shift was started on
  status: CashierShiftStatus;
  startedAt: string;
  endedAt?: string;
}

export interface CashierTransaction {
  id: string;
  shiftId: string;
  cashierId: string;
  pumpId: string;
  category: TransactionCategory;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  recordedAt: string;
}

export interface CashierShiftTotals {
  cashTotal: number;
  cardTotal: number;
  revenueTotal: number;
  transactionCount: number;
}

export interface CashHandover {
  id: string;
  shiftId: string;
  cashierId: string;
  pumpId: string;
  cashExpected: number;
  cashCounted: number;
  variance: number;
  cardTotal: number;
  revenueTotal: number;
  transactionCount: number;
  handoverTo: string;
  notes: string;
  submittedAt: string;
}

export interface DailyCashSummary {
  date: string;
  cashTotal: number;
  cardTotal: number;
  revenueTotal: number;
  transactionCount: number;
}
