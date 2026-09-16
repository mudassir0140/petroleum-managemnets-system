// @ts-nocheck
export type PaymentStatus = "Paid" | "Pending" | "Overdue";

export type PumpOwnerAccount = {
  pumpId: string;
  pumpNumber: number;
  pumpName: string;
  owner: string;
  phone: string;
  email: string;
  advancePaid: number;
  remainingDue: number;
  dueDate: string;
  status: PaymentStatus;
  lastPaymentDate: string;
  lastPaymentAmount: number;
  totalPaidYtd: number;
};

export const PUMP_OWNERS: PumpOwnerAccount[] = [];

export type PaymentTransaction = {
  id: string;
  pumpId?: string;
  owner: string;
  pumpName: string;
  amount: number;
  date: string;
  type?: string;
  method: string;
  status: string;
};

export const PAYMENT_TRANSACTIONS: PaymentTransaction[] = [];
