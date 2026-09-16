// @ts-nocheck
import type { FuelType } from "@/lib/dashboard/data/stations";
import { FUEL_PRICES } from "@/lib/dashboard/data/fuel-prices";
import { PUMPS } from "@/lib/dashboard/data/pumps";

const HOME_PUMP = PUMPS[1];

export const ATTENDANT = {
  id: "ATT-01",
  name: "Zeeshan Aziz",
  pumpId: HOME_PUMP.id,
  pumpName: HOME_PUMP.name,
};

export type PaymentMethod = "cash" | "card";

export type ShiftLog = {
  id: string;
  attendantId: string;
  pumpId: string;
  status: "active" | "closed";
  startedAt: string;
  endedAt: string | null;
};

export type SaleEntry = {
  id: string;
  shiftId: string;
  fuel: FuelType;
  liters: number;
  unitPrice: number;
  amount: number;
  paymentMethod: PaymentMethod;
  recordedAt: string;
};

export type ClosingReport = {
  id: string;
  shiftId: string;
  petrolLiters: number;
  dieselLiters: number;
  cashTotal: number;
  cardTotal: number;
  revenueTotal: number;
  cashCounted: number;
  variance: number;
  notes: string;
  submittedAt: string;
};

export function currentUnitPrice(fuel: FuelType): number {
  return FUEL_PRICES.find((p) => p.fuelType === fuel)?.ourPrice ?? 0;
}
