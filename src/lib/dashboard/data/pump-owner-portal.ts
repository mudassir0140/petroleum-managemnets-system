// @ts-nocheck
import { EMPLOYEES } from "@/lib/dashboard/data/employees";
import { FUEL_TANKS, STOCK_MOVEMENTS } from "@/lib/dashboard/data/fuel-stock";
import { pumpById, PUMPS } from "@/lib/dashboard/data/pumps";
import { TANKERS } from "@/lib/dashboard/data/tankers";

export const OWNER_PUMP_ID = "PUMP-03";

export const OWNER = {
  id: "OWN-01",
  name: PUMPS.find((p) => p.id === OWNER_PUMP_ID)?.owner ?? "Pump Owner",
  pumpId: OWNER_PUMP_ID,
};

export function ownerPump() {
  return pumpById(OWNER_PUMP_ID)!;
}

function homePumpLabel(): string {
  return `Pump ${ownerPump().number}`;
}

export function ownerStaff() {
  return EMPLOYEES.filter((e) => e.assignedPump === homePumpLabel());
}

export function ownerTanks() {
  return FUEL_TANKS.filter((t) => t.site === homePumpLabel());
}

export function ownerStockMovements() {
  const label = homePumpLabel();
  return STOCK_MOVEMENTS.filter((m) => m.from === label || m.to === label);
}

export function ownerIncomingTankers() {
  const label = homePumpLabel();
  return TANKERS.filter((t) => t.to.includes(label));
}

export type PaymentRecord = {
  id: string;
  period: string;
  amountDue: number;
  amountPaid: number;
  status: "Paid" | "Pending" | "Overdue";
  dueDate: string;
  paidDate: string | null;
};

export const OWNER_PAYMENTS: PaymentRecord[] = [];

export function ownerPaymentSummary() {
  const totalDue = OWNER_PAYMENTS.reduce((sum, p) => sum + p.amountDue, 0);
  const totalPaid = OWNER_PAYMENTS.reduce((sum, p) => sum + p.amountPaid, 0);
  return { totalDue, totalPaid, remainingDue: totalDue - totalPaid };
}
