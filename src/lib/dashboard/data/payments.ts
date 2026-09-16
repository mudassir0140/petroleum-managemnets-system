// @ts-nocheck
export type PaymentDirection = "Incoming" | "Outgoing";
export type PaymentMethod = "Bank Transfer" | "Cheque" | "Cash";
export type PaymentProcessStatus = "Completed" | "Processing" | "Failed";

export type CompanyPayment = {
  id: string;
  party: string;
  direction: PaymentDirection;
  amount: number;
  method: PaymentMethod;
  date: string;
  reference: string;
  status: PaymentProcessStatus;
};

export const COMPANY_PAYMENTS: CompanyPayment[] = [];
