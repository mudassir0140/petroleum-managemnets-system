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

export const SALE_RECORDS: SaleRecord[] = [
  { id: "SL-3001", pumpNumber: 1, pumpName: "Al-Rehman Filling Station", date: "2026-09-11", fuelType: "petrol", liters: 5400, revenue: 1517400, salesperson: "Saima Yousaf" },
  { id: "SL-3002", pumpNumber: 1, pumpName: "Al-Rehman Filling Station", date: "2026-09-11", fuelType: "diesel", liters: 3100, revenue: 905200, salesperson: "Saima Yousaf" },
  { id: "SL-3003", pumpNumber: 1, pumpName: "Al-Rehman Filling Station", date: "2026-09-10", fuelType: "petrol", liters: 5100, revenue: 1433100, salesperson: "Saima Yousaf" },
  { id: "SL-3004", pumpNumber: 2, pumpName: "Chaudhry Petroleum", date: "2026-09-11", fuelType: "petrol", liters: 6800, revenue: 1910800, salesperson: "Zeeshan Aziz" },
  { id: "SL-3005", pumpNumber: 2, pumpName: "Chaudhry Petroleum", date: "2026-09-11", fuelType: "diesel", liters: 4200, revenue: 1226400, salesperson: "Zeeshan Aziz" },
  { id: "SL-3006", pumpNumber: 2, pumpName: "Chaudhry Petroleum", date: "2026-09-11", fuelType: "hi-octane", liters: 900, revenue: 306900, salesperson: "Zeeshan Aziz" },
  { id: "SL-3007", pumpNumber: 3, pumpName: "Sunrise Fuel Station", date: "2026-09-11", fuelType: "petrol", liters: 4600, revenue: 1292600, salesperson: "Hina Sultana" },
  { id: "SL-3008", pumpNumber: 3, pumpName: "Sunrise Fuel Station", date: "2026-09-11", fuelType: "diesel", liters: 5100, revenue: 1489200, salesperson: "Hina Sultana" },
  { id: "SL-3009", pumpNumber: 3, pumpName: "Sunrise Fuel Station", date: "2026-09-10", fuelType: "petrol", liters: 4300, revenue: 1208300, salesperson: "Hina Sultana" },
  { id: "SL-3010", pumpNumber: 4, pumpName: "Highway Filling Station", date: "2026-09-09", fuelType: "petrol", liters: 3900, revenue: 1095900, salesperson: "Kamran Sheikh" },
  { id: "SL-3011", pumpNumber: 4, pumpName: "Highway Filling Station", date: "2026-09-09", fuelType: "diesel", liters: 2600, revenue: 759200, salesperson: "Kamran Sheikh" },
  { id: "SL-3012", pumpNumber: 5, pumpName: "Malik Fuels", date: "2026-09-11", fuelType: "petrol", liters: 5900, revenue: 1657900, salesperson: "Farah Deeba" },
  { id: "SL-3013", pumpNumber: 5, pumpName: "Malik Fuels", date: "2026-09-11", fuelType: "diesel", liters: 3800, revenue: 1109600, salesperson: "Farah Deeba" },
  { id: "SL-3014", pumpNumber: 5, pumpName: "Malik Fuels", date: "2026-09-11", fuelType: "hi-octane", liters: 620, revenue: 211420, salesperson: "Farah Deeba" },
  { id: "SL-3015", pumpNumber: 6, pumpName: "Gulshan Petroleum", date: "2026-09-08", fuelType: "petrol", liters: 3400, revenue: 955400, salesperson: "Rabia Naz" },
  { id: "SL-3016", pumpNumber: 6, pumpName: "Gulshan Petroleum", date: "2026-09-08", fuelType: "diesel", liters: 2100, revenue: 613200, salesperson: "Rabia Naz" },
];

export type PumpSalesTotal = { pumpNumber: number; pumpName: string; liters: number; revenue: number };

export function pumpSalesTotals(records: SaleRecord[] = SALE_RECORDS): PumpSalesTotal[] {
  const totals = new Map<number, PumpSalesTotal>();
  for (const record of records) {
    const entry = totals.get(record.pumpNumber) ?? {
      pumpNumber: record.pumpNumber,
      pumpName: record.pumpName,
      liters: 0,
      revenue: 0,
    };
    entry.liters += record.liters;
    entry.revenue += record.revenue;
    totals.set(record.pumpNumber, entry);
  }
  return Array.from(totals.values()).sort((a, b) => a.pumpNumber - b.pumpNumber);
}

export type SalesTarget = {
  id: string;
  pumpNumber: number;
  pumpName: string;
  salesperson: string;
  month: string;
  target: number;
  achieved: number;
};

/** `achieved` mirrors each pump's `monthlySales` in pumps.ts so the two dashboards agree. */
export const SALES_TARGETS: SalesTarget[] = PUMPS.map((pump, i) => ({
  id: `TGT-0${i + 1}`,
  pumpNumber: pump.number,
  pumpName: pump.name,
  salesperson: PUMP_SALESPERSON[pump.number] ?? "Unassigned",
  month: "September 2026",
  target: [70000000, 88000000, 76000000, 55000000, 80000000, 40000000][i] ?? pump.monthlySales,
  achieved: pump.monthlySales,
}));

export type PeriodPoint = { label: string; liters: number; revenue: number };

export const DAILY_SALES: PeriodPoint[] = [
  { label: "Mon", liters: 38200, revenue: 10740000 },
  { label: "Tue", liters: 40100, revenue: 11280000 },
  { label: "Wed", liters: 35600, revenue: 10010000 },
  { label: "Thu", liters: 41800, revenue: 11760000 },
  { label: "Fri", liters: 44200, revenue: 12430000 },
  { label: "Sat", liters: 47600, revenue: 13390000 },
  { label: "Sun", liters: 42400, revenue: 11930000 },
];

export const WEEKLY_SALES: PeriodPoint[] = [
  { label: "Week 1", liters: 268000, revenue: 75400000 },
  { label: "Week 2", liters: 281000, revenue: 79100000 },
  { label: "Week 3", liters: 259000, revenue: 72900000 },
  { label: "Week 4", liters: 291900, revenue: 82140000 },
];

export const MONTHLY_SALES: PeriodPoint[] = [
  { label: "Apr", liters: 1120000, revenue: 315200000 },
  { label: "May", liters: 1168000, revenue: 329400000 },
  { label: "Jun", liters: 1210000, revenue: 342800000 },
  { label: "Jul", liters: 1145000, revenue: 323100000 },
  { label: "Aug", liters: 1236000, revenue: 349600000 },
  { label: "Sep", liters: 1289000, revenue: 366300000 },
];

export const SALES_REPORT_TYPES = [
  { id: "pump-wise-sales", name: "Pump-wise Sales Report", description: "Litres and revenue sold at every pump, by fuel type.", icon: "chart" as const },
  { id: "sales-performance", name: "Sales Performance Report", description: "Target vs. achieved sales per pump and salesperson.", icon: "trending" as const },
  { id: "daily-sales", name: "Daily Sales Report", description: "Day-by-day litres and revenue for the current week.", icon: "calendar" as const },
  { id: "monthly-sales", name: "Monthly Sales Report", description: "Month-by-month litres and revenue for the last 6 months.", icon: "calendar" as const },
];

export type SalesReport = {
  id: string;
  name: string;
  type: string;
  dateRange: string;
  pump: string;
  generatedBy: string;
  format: "CSV" | "PDF";
  status: "Ready" | "Generating";
};

export const SALES_REPORTS: SalesReport[] = [
  { id: "SRPT-501", name: "Pump-wise Sales Report — Week 36", type: "Pump-wise Sales Report", dateRange: "Sep 5 – Sep 11, 2026", pump: "All Pumps", generatedBy: "Sales Manager", format: "CSV", status: "Ready" },
  { id: "SRPT-500", name: "Sales Performance Report — September", type: "Sales Performance Report", dateRange: "Sep 1 – Sep 11, 2026", pump: "All Pumps", generatedBy: "Sales Manager", format: "PDF", status: "Ready" },
  { id: "SRPT-497", name: "Daily Sales Report — Sep 10", type: "Daily Sales Report", dateRange: "Sep 10, 2026", pump: "All Pumps", generatedBy: "Sales Manager", format: "CSV", status: "Ready" },
  { id: "SRPT-492", name: "Monthly Sales Report — August", type: "Monthly Sales Report", dateRange: "Aug 1 – Aug 31, 2026", pump: "All Pumps", generatedBy: "Sales Manager", format: "PDF", status: "Ready" },
  { id: "SRPT-488", name: "Pump-wise Sales Report — Pump 2", type: "Pump-wise Sales Report", dateRange: "Sep 1 – Sep 11, 2026", pump: "Pump 2", generatedBy: "Sales Manager", format: "CSV", status: "Ready" },
  { id: "SRPT-480", name: "Sales Performance Report — August", type: "Sales Performance Report", dateRange: "Aug 1 – Aug 31, 2026", pump: "All Pumps", generatedBy: "Sales Manager", format: "CSV", status: "Generating" },
];
