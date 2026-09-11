import type { FuelType } from "@/lib/dashboard/data/stations";

export type DispatchStatus = "Scheduled" | "Dispatched" | "In Transit" | "Completed" | "Cancelled";
export type DispatchPriority = "Normal" | "High" | "Urgent";

export type DispatchOrder = {
  id: string;
  tanker: string;
  driver: string;
  routeId: string;
  fuelType: FuelType;
  quantity: number;
  scheduledDate: string;
  scheduledTime: string;
  priority: DispatchPriority;
  status: DispatchStatus;
  notes: string;
};

export const DISPATCH_ORDERS: DispatchOrder[] = [
  { id: "DSP-3001", tanker: "T-101", driver: "Nasir Hussain", routeId: "RT-01", fuelType: "petrol", quantity: 15000, scheduledDate: "2026-09-11", scheduledTime: "02:00 AM", priority: "High", status: "In Transit", notes: "Priority delivery — pump running low" },
  { id: "DSP-3002", tanker: "T-102", driver: "Tariq Javed", routeId: "RT-02", fuelType: "diesel", quantity: 18000, scheduledDate: "2026-09-11", scheduledTime: "05:30 AM", priority: "Normal", status: "In Transit", notes: "" },
  { id: "DSP-3003", tanker: "T-103", driver: "Adnan Malik", routeId: "RT-05", fuelType: "petrol", quantity: 15000, scheduledDate: "2026-09-11", scheduledTime: "06:00 AM", priority: "Normal", status: "In Transit", notes: "" },
  { id: "DSP-3004", tanker: "T-108", driver: "Rashid Latif", routeId: "RT-06", fuelType: "diesel", quantity: 18000, scheduledDate: "2026-09-11", scheduledTime: "06:30 AM", priority: "Urgent", status: "In Transit", notes: "Route under maintenance — advise alt path" },
  { id: "DSP-3005", tanker: "T-105", driver: "Kashif Bhatti", routeId: "RT-04", fuelType: "diesel", quantity: 18000, scheduledDate: "2026-09-11", scheduledTime: "07:00 AM", priority: "Normal", status: "Dispatched", notes: "Return trip in progress" },
  { id: "DSP-3006", tanker: "T-106", driver: "Faisal Mahmood", routeId: "RT-02", fuelType: "hi-octane", quantity: 8000, scheduledDate: "2026-09-12", scheduledTime: "06:30 AM", priority: "Normal", status: "Scheduled", notes: "" },
  { id: "DSP-3007", tanker: "T-107", driver: "Bilal Aslam", routeId: "RT-03", fuelType: "petrol", quantity: 15000, scheduledDate: "2026-09-12", scheduledTime: "06:00 AM", priority: "Normal", status: "Scheduled", notes: "" },
  { id: "DSP-3008", tanker: "T-104", driver: "Shahid Iqbal", routeId: "RT-03", fuelType: "petrol", quantity: 12000, scheduledDate: "2026-09-10", scheduledTime: "06:00 AM", priority: "Normal", status: "Completed", notes: "Delivered on time" },
];
