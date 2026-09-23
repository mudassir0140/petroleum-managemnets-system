import type { PumpRecord } from "@/lib/db/models";
import { findAccountByPumpId } from "@/lib/auth/user-store";
import {
  getSalesHistory as getSalesHistoryFromDb,
  getTodaySales as getTodaySalesFromDb,
} from "@/lib/db/sales-service";
import type {
  AttendanceRecord,
  AttendanceStatus,
  DailySales,
  DirectoryOwner,
  FuelType,
  IncomingTanker,
  PaymentRecord,
  PaymentSummary,
  Pump,
  Shift,
  ShiftSales,
  StaffMember,
  StockHistoryEntry,
  StockSnapshot,
  TankerStatus,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Pump registry (multi-tenant simulation)
//
// Every function below takes a `pumpId` and reads/derives data for that pump
// ONLY. Pages never accept a pump id from the client — they always pull it
// from `getSession()` (see lib/session.ts) — so a Pump Owner can never fetch
// another pump's records by guessing an id or editing a URL.
// ---------------------------------------------------------------------------

export const PUMPS: Pump[] = [];

// Pumps the Admin created in MongoDB, registered per request by getSession()
// (lib/session.ts) so every generator below serves that pump's real record.
const LIVE_PUMPS = new Map<string, PumpRecord>();

export function registerLivePump(record: PumpRecord): void {
  LIVE_PUMPS.set(record._id!.toString(), record);
}

export function getPump(pumpId: string): Pump {
  const pump = PUMPS.find((p) => p.id === pumpId);
  if (pump) return pump;

  const live = LIVE_PUMPS.get(pumpId);
  if (live) {
    return {
      id: pumpId,
      name: live.name,
      location: live.address,
      city: live.city,
      ownerId: pumpId,
      ownerName: live.ownerName,
      ownerEmail: live.ownerEmail,
      avatarColor: "var(--brand-500)",
      online: live.status === "Online",
    };
  }

  // Pumps created through signup aren't in the static demo registry above —
  // look them up from the real account store instead. Every sales/stock/
  // staff/etc. generator below is keyed purely by pumpId string, so a
  // freshly signed-up pump gets the same fully-populated demo data for free.
  const account = findAccountByPumpId(pumpId);
  if (account) {
    return {
      id: account.pumpId,
      name: account.pumpName,
      location: account.pumpLocation,
      city: "",
      ownerId: account.id,
      ownerName: account.fullName,
      ownerEmail: account.email,
      avatarColor: "var(--brand-500)",
      online: true,
    };
  }

  throw new Error("Pump not found or access denied");
}

// Used by attendant signup to validate a Pump ID (shared by the Pump Owner
// as an invite code) before letting someone join it.
export function pumpExists(pumpId: string): boolean {
  return PUMPS.some((p) => p.id === pumpId) || LIVE_PUMPS.has(pumpId) || findAccountByPumpId(pumpId) !== null;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Sales
// ---------------------------------------------------------------------------

// Backed by the real `sales` MongoDB collection — a day has real zeros
// until the Pump Owner logs that day's shifts (see sales-service.ts).
export async function getSalesHistory(pumpId: string, days: number): Promise<DailySales[]> {
  getPump(pumpId);
  return getSalesHistoryFromDb(pumpId, days);
}

export async function getTodaySales(pumpId: string): Promise<DailySales> {
  getPump(pumpId);
  return getTodaySalesFromDb(pumpId);
}

// ---------------------------------------------------------------------------
// Fuel stock
// ---------------------------------------------------------------------------

export function getStockSnapshots(pumpId: string): StockSnapshot[] {
  getPump(pumpId);
  const live = LIVE_PUMPS.get(pumpId);
  if (!live) return [];
  const snapshot = (fuel: FuelType, currentLitres: number, capacityLitres: number): StockSnapshot => ({
    fuel,
    capacityLitres,
    currentLitres,
    receivedLitres7d: 0,
    soldLitres7d: 0,
    reorderLevelLitres: Math.round(capacityLitres * 0.2),
  });
  return [
    snapshot("petrol", live.petrolStock, live.petrolCapacity),
    snapshot("diesel", live.dieselStock, live.dieselCapacity),
  ];
}

export function getStockHistory(pumpId: string, days: number): StockHistoryEntry[] {
  getPump(pumpId);
  return [];
}

// ---------------------------------------------------------------------------
// Incoming tankers
// ---------------------------------------------------------------------------

export function getIncomingTankers(pumpId: string): IncomingTanker[] {
  getPump(pumpId);
  return [];
}

// ---------------------------------------------------------------------------
// Staff & attendance
// ---------------------------------------------------------------------------

export function getStaff(pumpId: string): StaffMember[] {
  getPump(pumpId);
  return [];
}

export const SHIFT_TIMES: Record<Shift, { start: string; end: string }> = {
  morning: { start: "06:00", end: "14:00" },
  evening: { start: "14:00", end: "22:00" },
  night: { start: "22:00", end: "06:00" },
};

export function getAttendanceToday(pumpId: string): AttendanceRecord[] {
  getPump(pumpId);
  return [];
}

export function getAttendanceHistory(pumpId: string, days: number): AttendanceRecord[] {
  getPump(pumpId);
  return [];
}

// ---------------------------------------------------------------------------
// Payments to company
// ---------------------------------------------------------------------------

export function getPaymentSummary(pumpId: string): PaymentSummary {
  getPump(pumpId);
  return {
    totalDueThisCycle: 0,
    advancePaid: 0,
    remainingDue: 0,
    nextDueDate: isoDate(new Date()),
    totalPaidAllTime: 0,
    history: [],
  };
}

// ---------------------------------------------------------------------------
// Connect & chat directory
// ---------------------------------------------------------------------------

export function getDirectory(currentOwnerId: string): DirectoryOwner[] {
  return [];
}
