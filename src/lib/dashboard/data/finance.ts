export const FINANCE_KPIS = [
  { label: "Total Revenue (MTD)", value: "Rs. 412.8M", delta: "+8.4%", trend: "up" as const },
  { label: "Total Expenses (MTD)", value: "Rs. 298.1M", delta: "+3.1%", trend: "down" as const },
  { label: "Net Profit (MTD)", value: "Rs. 114.7M", delta: "+21.6%", trend: "up" as const },
  { label: "Profit Margin", value: "27.8%", delta: "+2.3 pts", trend: "up" as const },
];

export const DAILY_PAYMENTS = {
  received: 15200000,
  remaining: 3400000,
};

export const WEEKLY_PAYMENT_SUMMARY = [
  { day: "Mon", received: 13800000, remaining: 2100000 },
  { day: "Tue", received: 14600000, remaining: 2400000 },
  { day: "Wed", received: 12900000, remaining: 3100000 },
  { day: "Thu", received: 15100000, remaining: 1900000 },
  { day: "Fri", received: 16400000, remaining: 2600000 },
  { day: "Sat", received: 17800000, remaining: 3300000 },
  { day: "Sun", received: 15200000, remaining: 3400000 },
];

export const MONTHLY_FINANCE = [
  { month: "Apr", revenue: 356, expenses: 268, profit: 88 },
  { month: "May", revenue: 371, expenses: 274, profit: 97 },
  { month: "Jun", revenue: 388, expenses: 281, profit: 107 },
  { month: "Jul", revenue: 366, expenses: 279, profit: 87 },
  { month: "Aug", revenue: 395, expenses: 289, profit: 106 },
  { month: "Sep", revenue: 413, expenses: 298, profit: 115 },
];

export const EXPENSE_BREAKDOWN = [
  { category: "Fuel procurement", amount: 210000000, percent: 70.4, color: "bg-amber-500" },
  { category: "Salaries & wages", amount: 42000000, percent: 14.1, color: "bg-orange-500" },
  { category: "Logistics & fleet", amount: 24500000, percent: 8.2, color: "bg-sky-500" },
  { category: "Maintenance", amount: 11800000, percent: 4.0, color: "bg-violet-500" },
  { category: "Utilities", amount: 6200000, percent: 2.1, color: "bg-rose-500" },
  { category: "Taxes & levies", amount: 3600000, percent: 1.2, color: "bg-slate-500" },
];

export type InvoiceStatus = "Paid" | "Pending" | "Overdue";

export type Invoice = {
  id: string;
  party: string;
  type: "Receivable" | "Payable";
  amount: number;
  dueDate: string;
  status: InvoiceStatus;
};

export const INVOICES: Invoice[] = [
  { id: "INV-3301", party: "Sana Malik (Pump 3)", type: "Receivable", amount: 610000, dueDate: "2026-09-05", status: "Overdue" },
  { id: "INV-3298", party: "Waqar Hussain (Pump 4)", type: "Receivable", amount: 250000, dueDate: "2026-09-02", status: "Overdue" },
  { id: "INV-3312", party: "Imran Chaudhry (Pump 2)", type: "Receivable", amount: 320000, dueDate: "2026-09-18", status: "Pending" },
  { id: "INV-3315", party: "Malik Fuels (Pump 5)", type: "Receivable", amount: 180000, dueDate: "2026-09-15", status: "Pending" },
  { id: "INV-7701", party: "PARCO Refinery", type: "Payable", amount: 12800000, dueDate: "2026-09-18", status: "Pending" },
  { id: "INV-7702", party: "Attock Refinery", type: "Payable", amount: 6600000, dueDate: "2026-09-20", status: "Pending" },
  { id: "INV-7690", party: "FBR — Sales Tax", type: "Payable", amount: 3600000, dueDate: "2026-09-30", status: "Pending" },
  { id: "INV-7688", party: "Fleet Insurance Co.", type: "Payable", amount: 2100000, dueDate: "2026-08-30", status: "Paid" },
];
