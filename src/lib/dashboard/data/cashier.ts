// @ts-nocheck
import { PUMPS } from "@/lib/dashboard/data/pumps";

const HOME_PUMP = PUMPS[0];

export const CASHIER = {
  id: "CSH-01",
  name: "Hamza Farooq",
  pumpId: HOME_PUMP.id,
  pumpName: HOME_PUMP.name,
};

export type PaymentMethod = "cash" | "card";
export type TransactionCategory = "fuel" | "shop" | "service" | "other";

export const TRANSACTION_CATEGORIES: TransactionCategory[] = ["fuel", "shop", "service", "other"];

export type CashierShift = {
  id: string;
  cashierId: string;
  pumpId: string;
  status: "active" | "closed";
  startedAt: string;
  endedAt: string | null;
};

export type CashierTransaction = {
  id: string;
  shiftId: string;
  category: TransactionCategory;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  recordedAt: string;
};

export type CashHandover = {
  id: string;
  shiftId: string;
  cashExpected: number;
  cashCounted: number;
  variance: number;
  cardTotal: number;
  revenueTotal: number;
  transactionCount: number;
  handoverTo: string;
  notes: string;
  submittedAt: string;
};
