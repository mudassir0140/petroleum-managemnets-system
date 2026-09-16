// @ts-nocheck
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

export const DISPATCH_ORDERS: DispatchOrder[] = [];
