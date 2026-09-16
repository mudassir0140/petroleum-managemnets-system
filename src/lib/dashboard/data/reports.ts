// @ts-nocheck
export const REPORT_TYPES = [
  { id: "pump-sales", name: "Pump-wise Monthly Sale Report", description: "Every pump's monthly sales in litres and revenue.", icon: "chart" as const },
  { id: "fleet", name: "Tanker Logistics Report", description: "Dispatch, route and delivery discrepancy records.", icon: "truck" as const },
  { id: "employee", name: "Employee Report", description: "Staff directory, assignment, attendance and payroll.", icon: "users" as const },
  { id: "finance", name: "Finance Report", description: "Revenue, expenses and outstanding invoices.", icon: "wallet" as const },
  { id: "stock", name: "Fuel Stock Report", description: "Tank levels, received and distributed stock.", icon: "tank" as const },
  { id: "payment", name: "Payment Report", description: "Pump owner advances, dues and payment history.", icon: "truck" as const },
  { id: "profit-loss", name: "Profit/Loss Report", description: "Monthly revenue vs. expenses and net profit.", icon: "wallet" as const },
];

export type GeneratedReport = {
  id: string;
  name: string;
  type: string;
  dateRange: string;
  pump: string;
  generatedDate: string;
  generatedBy: string;
  format: "CSV" | "PDF";
  status: "Ready" | "Generating";
};

export const GENERATED_REPORTS: GeneratedReport[] = [];

export type SalesReport = {
  id: string;
  type: string;
  date: string;
  data: unknown;
};

export const SALES_REPORTS: SalesReport[] = [];
export const SALES_REPORT_TYPES: string[] = [];
export const SALES_TARGETS: unknown[] = [];
