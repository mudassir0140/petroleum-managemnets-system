// @ts-nocheck
export const OVERVIEW_KPIS = [
  { label: "Total Revenue", value: "Rs. 15.2M", delta: "+6.2%", trend: "up" as const, hint: "today" },
  { label: "Total Expenses", value: "Rs. 9.8M", delta: "+2.1%", trend: "down" as const, hint: "today" },
  { label: "Net Profit", value: "Rs. 5.4M", delta: "+11.4%", trend: "up" as const, hint: "today" },
  { label: "Total Fuel Sold Today", value: "48,320 L", delta: "+3.8%", trend: "up" as const, hint: "all fuel types" },
  { label: "Petrol Sold Today", value: "22,700 L", delta: "+4.1%", trend: "up" as const, hint: "across 6 pumps" },
  { label: "Diesel Sold Today", value: "20,200 L", delta: "+2.6%", trend: "up" as const, hint: "across 6 pumps" },
  { label: "Active Tankers", value: "5 / 8", delta: "+1", trend: "up" as const, hint: "3 at depot" },
  { label: "Pumps Online", value: "4 / 6", delta: "-2", trend: "down" as const, hint: "1 maintenance, 1 offline" },
  { label: "Employees Present", value: "13 / 15", delta: "2 absent", trend: "down" as const, hint: "today" },
  { label: "Pending Pump Owner Payments", value: "Rs. 1.36M", delta: "3 pumps", trend: "down" as const, hint: "overdue or pending" },
];

export const WEEKLY_REVENUE = [
  { day: "Mon", value: 14.2 },
  { day: "Tue", value: 15.8 },
  { day: "Wed", value: 13.6 },
  { day: "Thu", value: 16.9 },
  { day: "Fri", value: 19.4 },
  { day: "Sat", value: 21.1 },
  { day: "Sun", value: 15.2 },
];

export const FUEL_MIX = [
  { fuel: "Petrol", percent: 47, color: "bg-amber-500" },
  { fuel: "Diesel", percent: 42, color: "bg-orange-500" },
  { fuel: "Hi-Octane", percent: 11, color: "bg-sky-500" },
];

export const NETWORK_STATUS = [
  { pump: "Pump 1", name: "Al-Rehman Filling Station", city: "Karachi", status: "Online" as const },
  { pump: "Pump 2", name: "Chaudhry Petroleum", city: "Lahore", status: "Online" as const },
  { pump: "Pump 3", name: "Sunrise Fuel Station", city: "Islamabad", status: "Online" as const },
  { pump: "Pump 4", name: "Highway Filling Station", city: "Faisalabad", status: "Maintenance" as const },
  { pump: "Pump 5", name: "Malik Fuels", city: "Rawalpindi", status: "Online" as const },
  { pump: "Pump 6", name: "Gulshan Petroleum", city: "Multan", status: "Offline" as const },
];

export const RECENT_ACTIVITY = [
  {
    id: "act-1",
    time: "09:40 AM",
    title: "Tanker T-104 delivered 11,800L Petrol",
    detail: "Central Depot → Pump 3, Islamabad",
    tone: "success" as const,
  },
  {
    id: "act-2",
    time: "08:10 AM",
    title: "Pump 4 flagged for maintenance",
    detail: "Highway Filling Station, Faisalabad — dispenser fault",
    tone: "warning" as const,
  },
  {
    id: "act-3",
    time: "07:55 AM",
    title: "Payment received from Bilal Ahmed (Pump 6)",
    detail: "Rs. 3,410,000 via bank transfer",
    tone: "success" as const,
  },
  {
    id: "act-4",
    time: "07:20 AM",
    title: "Petrol tank at Pump 3 below reorder threshold",
    detail: "Current level 20% of 40,000L capacity",
    tone: "danger" as const,
  },
  {
    id: "act-5",
    time: "06:48 AM",
    title: "Shift attendance recorded for 13 employees",
    detail: "Network-wide — morning shift",
    tone: "neutral" as const,
  },
];

export const OVERVIEW_ALERTS = [
  {
    id: "alert-1",
    title: "Pump 3 petrol tank critically low",
    description: "20% remaining — schedule a tanker within 24 hours.",
    severity: "critical" as const,
  },
  {
    id: "alert-2",
    title: "3 pump owner payments overdue or pending",
    description: "Rs. 1.36M outstanding across Pump 2, 3, 4 and 5.",
    severity: "warning" as const,
  },
  {
    id: "alert-3",
    title: "Pump 6 has gone offline",
    description: "Gulshan Petroleum, Multan — no sales recorded since yesterday.",
    severity: "critical" as const,
  },
];

export const PUMP_VISITS: unknown[] = [];
export function pumpsByCity(data: unknown[]): unknown { return {}; }
export function pumpSalesTotals(data: unknown[]): unknown { return {}; }
