import { findAccountByPumpId } from "@/lib/auth/user-store";
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

export function getPump(pumpId: string): Pump {
  const pump = PUMPS.find((p) => p.id === pumpId);
  if (pump) return pump;

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
  return PUMPS.some((p) => p.id === pumpId) || findAccountByPumpId(pumpId) !== null;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Sales
// ---------------------------------------------------------------------------

export function getSalesHistory(pumpId: string, days: number): DailySales[] {
  getPump(pumpId);
  return [];
}

export function getTodaySales(pumpId: string): DailySales {
  const history = getSalesHistory(pumpId, 1);
  return history[0] || {
    date: new Date().toISOString().slice(0, 10),
    petrolLitres: 0,
    dieselLitres: 0,
    revenue: 0,
    cashRevenue: 0,
    cardRevenue: 0,
    shifts: [],
  };
}

// ---------------------------------------------------------------------------
// Fuel stock
// ---------------------------------------------------------------------------

export function getStockSnapshots(pumpId: string): StockSnapshot[] {
  getPump(pumpId);
  return [];
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
