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

export const COMPANY_PAYMENTS: CompanyPayment[] = [
  { id: "CPAY-9001", party: "Sana Malik (Pump 3)", direction: "Incoming", amount: 610000, method: "Bank Transfer", date: "2026-09-10", reference: "INV-3301", status: "Processing" },
  { id: "CPAY-9002", party: "PARCO Refinery", direction: "Outgoing", amount: 12800000, method: "Bank Transfer", date: "2026-09-09", reference: "INV-7701", status: "Processing" },
  { id: "CPAY-9003", party: "Attock Refinery", direction: "Outgoing", amount: 6600000, method: "Bank Transfer", date: "2026-09-08", reference: "INV-7702", status: "Processing" },
  { id: "CPAY-9004", party: "FBR — Sales Tax", direction: "Outgoing", amount: 3600000, method: "Cheque", date: "2026-09-07", reference: "INV-7690", status: "Processing" },
  { id: "CPAY-9005", party: "Fleet Insurance Co.", direction: "Outgoing", amount: 2100000, method: "Bank Transfer", date: "2026-08-30", reference: "INV-7688", status: "Completed" },
  { id: "CPAY-9006", party: "Imran Chaudhry (Pump 2)", direction: "Incoming", amount: 320000, method: "Bank Transfer", date: "2026-09-06", reference: "INV-3312", status: "Completed" },
  { id: "CPAY-9007", party: "Malik Fuels (Pump 5)", direction: "Incoming", amount: 180000, method: "Cash", date: "2026-09-05", reference: "INV-3315", status: "Completed" },
  { id: "CPAY-9008", party: "Waqar Hussain (Pump 4)", direction: "Incoming", amount: 250000, method: "Cheque", date: "2026-09-02", reference: "INV-3298", status: "Failed" },
];
