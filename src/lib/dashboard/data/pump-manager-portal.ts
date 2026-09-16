// @ts-nocheck
import { EMPLOYEES } from "@/lib/dashboard/data/employees";
import { FUEL_TANKS, STOCK_MOVEMENTS } from "@/lib/dashboard/data/fuel-stock";
import { pumpById } from "@/lib/dashboard/data/pumps";
import { TANKERS } from "@/lib/dashboard/data/tankers";

// Every helper below is hardcoded to this one pump — a Pump Manager page
// never accepts a pump id from a prop, query param or client input, so the
// manager can only ever see their assigned pump's records.
export const MANAGER_PUMP_ID = "PUMP-01";

export const MANAGER = {
  id: "EMP-01",
  name: EMPLOYEES.find((e) => e.id === "EMP-01")?.name ?? "Pump Manager",
  pumpId: MANAGER_PUMP_ID,
};

export function managerPump() {
  return pumpById(MANAGER_PUMP_ID);
}

function homePumpLabel(): string | null {
  const pump = managerPump();
  if (!pump) return null;
  return `Pump ${pump.number}`;
}

export function managerStaff() {
  const label = homePumpLabel();
  if (!label) return [];
  return EMPLOYEES.filter((e) => e.assignedPump === label);
}

export function managerTanks() {
  const label = homePumpLabel();
  if (!label) return [];
  return FUEL_TANKS.filter((t) => t.site === label);
}

export function managerStockMovements() {
  const label = homePumpLabel();
  if (!label) return [];
  return STOCK_MOVEMENTS.filter((m) => m.from === label || m.to === label);
}

export function managerIncomingTankers() {
  const label = homePumpLabel();
  if (!label) return [];
  return TANKERS.filter((t) => t.to.includes(label));
}
