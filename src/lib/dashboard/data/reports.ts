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

export const GENERATED_REPORTS: GeneratedReport[] = [
  { id: "RPT-9001", name: "Pump-wise Sale Report — Week 36", type: "Pump-wise Monthly Sale Report", dateRange: "Sep 1 – Sep 7, 2026", pump: "All Pumps", generatedDate: "2026-09-08", generatedBy: "Company Owner", format: "CSV", status: "Ready" },
  { id: "RPT-9000", name: "Fuel Stock Report — August", type: "Fuel Stock Report", dateRange: "Aug 1 – Aug 31, 2026", pump: "All Pumps", generatedDate: "2026-09-01", generatedBy: "Company Owner", format: "PDF", status: "Ready" },
  { id: "RPT-8994", name: "Tanker Logistics Report — August", type: "Tanker Logistics Report", dateRange: "Aug 1 – Aug 31, 2026", pump: "All Pumps", generatedDate: "2026-09-01", generatedBy: "Company Owner", format: "CSV", status: "Ready" },
  { id: "RPT-8990", name: "Finance Report — Q3 (partial)", type: "Finance Report", dateRange: "Jul 1 – Sep 10, 2026", pump: "All Pumps", generatedDate: "2026-09-10", generatedBy: "Company Owner", format: "PDF", status: "Generating" },
  { id: "RPT-8983", name: "Employee Report — Week 36", type: "Employee Report", dateRange: "Sep 1 – Sep 7, 2026", pump: "All Pumps", generatedDate: "2026-09-08", generatedBy: "Company Owner", format: "CSV", status: "Ready" },
  { id: "RPT-8975", name: "Payment Report — August", type: "Payment Report", dateRange: "Aug 1 – Aug 31, 2026", pump: "Pump 5", generatedDate: "2026-09-01", generatedBy: "Company Owner", format: "PDF", status: "Ready" },
  { id: "RPT-8960", name: "Profit/Loss Report — Week 35", type: "Profit/Loss Report", dateRange: "Aug 25 – Aug 31, 2026", pump: "All Pumps", generatedDate: "2026-09-01", generatedBy: "Company Owner", format: "CSV", status: "Ready" },
];
