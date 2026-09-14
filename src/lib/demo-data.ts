import { createRng, pick, range, rangeInt } from "@/lib/rng";
import { getCurrentFuelPrice } from "@/lib/fuel-price-store";
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

export const PUMPS: Pump[] = [
  {
    id: "PUMP-014",
    name: "Al-Falah Fuel Station",
    location: "Ferozepur Road",
    city: "Lahore",
    ownerId: "OWN-014",
    ownerName: "Fahad Malik",
    ownerEmail: "fmkports@gmail.com",
    avatarColor: "var(--brand-500)",
    online: true,
  },
  {
    id: "PUMP-021",
    name: "Shahbaz Petroleum",
    location: "Shahrah-e-Faisal",
    city: "Karachi",
    ownerId: "OWN-021",
    ownerName: "Bilal Ahmed",
    ownerEmail: "bilal.ahmed@example.com",
    avatarColor: "var(--series-2)",
    online: true,
  },
  {
    id: "PUMP-032",
    name: "Margalla Fuel Point",
    location: "Blue Area",
    city: "Islamabad",
    ownerId: "OWN-032",
    ownerName: "Sana Iqbal",
    ownerEmail: "sana.iqbal@example.com",
    avatarColor: "var(--series-3)",
    online: false,
  },
  {
    id: "PUMP-047",
    name: "Chenab Petroleum Services",
    location: "Susan Road",
    city: "Faisalabad",
    ownerId: "OWN-047",
    ownerName: "Usman Tariq",
    ownerEmail: "usman.tariq@example.com",
    avatarColor: "var(--series-7)",
    online: false,
  },
  {
    id: "PUMP-058",
    name: "Multan Highway Fuels",
    location: "Bosan Road",
    city: "Multan",
    ownerId: "OWN-058",
    ownerName: "Ayesha Noor",
    ownerEmail: "ayesha.noor@example.com",
    avatarColor: "var(--series-5)",
    online: true,
  },
  {
    id: "PUMP-063",
    name: "Frontier Fuel Hub",
    location: "Ring Road",
    city: "Peshawar",
    ownerId: "OWN-063",
    ownerName: "Imran Sethi",
    ownerEmail: "imran.sethi@example.com",
    avatarColor: "var(--series-4)",
    online: false,
  },
];

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

function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

const SHIFTS: Shift[] = ["morning", "evening", "night"];

// ---------------------------------------------------------------------------
// Sales
// ---------------------------------------------------------------------------

function generateDailySales(pumpId: string, date: Date, petrolPrice: number, dieselPrice: number): DailySales {
  const dateStr = isoDate(date);
  const rng = createRng(`${pumpId}:sales:${dateStr}`);
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const demandBoost = isWeekend ? 1.12 : 1;

  const shifts: ShiftSales[] = SHIFTS.map((shift) => {
    const shiftFactor = shift === "morning" ? 0.4 : shift === "evening" ? 0.38 : 0.22;
    const petrolLitres = Math.round(range(rng, 700, 1450) * shiftFactor * demandBoost * 2.4);
    const dieselLitres = Math.round(range(rng, 550, 1200) * shiftFactor * demandBoost * 2.4);
    const revenue = Math.round(petrolLitres * petrolPrice + dieselLitres * dieselPrice);
    const cashShare = range(rng, 0.52, 0.72);
    const cashRevenue = Math.round(revenue * cashShare);
    return {
      shift,
      petrolLitres,
      dieselLitres,
      revenue,
      cashRevenue,
      cardRevenue: revenue - cashRevenue,
    };
  });

  return {
    date: dateStr,
    petrolLitres: shifts.reduce((sum, s) => sum + s.petrolLitres, 0),
    dieselLitres: shifts.reduce((sum, s) => sum + s.dieselLitres, 0),
    revenue: shifts.reduce((sum, s) => sum + s.revenue, 0),
    cashRevenue: shifts.reduce((sum, s) => sum + s.cashRevenue, 0),
    cardRevenue: shifts.reduce((sum, s) => sum + s.cardRevenue, 0),
    shifts,
  };
}

export function getSalesHistory(pumpId: string, days: number): DailySales[] {
  getPump(pumpId);
  const price = getCurrentFuelPrice();
  const result: DailySales[] = [];
  for (let i = days - 1; i >= 0; i--) {
    result.push(generateDailySales(pumpId, daysAgo(i), price.petrol, price.diesel));
  }
  return result;
}

export function getTodaySales(pumpId: string): DailySales {
  const history = getSalesHistory(pumpId, 1);
  return history[0];
}

// ---------------------------------------------------------------------------
// Fuel stock
// ---------------------------------------------------------------------------

export function getStockSnapshots(pumpId: string): StockSnapshot[] {
  getPump(pumpId);
  const rng = createRng(`${pumpId}:stock:${isoDate(new Date())}`);
  const last7 = getSalesHistory(pumpId, 7);

  const fuels: { fuel: FuelType; capacity: number }[] = [
    { fuel: "petrol", capacity: 22000 },
    { fuel: "diesel", capacity: 18000 },
  ];

  return fuels.map(({ fuel, capacity }) => {
    const soldLitres7d = last7.reduce(
      (sum, day) => sum + (fuel === "petrol" ? day.petrolLitres : day.dieselLitres),
      0,
    );
    const receivedLitres7d = Math.round(soldLitres7d * range(rng, 0.85, 1.2));
    const ratio = range(rng, 0.32, 0.78);
    return {
      fuel,
      capacityLitres: capacity,
      currentLitres: Math.round(capacity * ratio),
      receivedLitres7d,
      soldLitres7d,
      reorderLevelLitres: Math.round(capacity * 0.2),
    };
  });
}

export function getStockHistory(pumpId: string, days: number): StockHistoryEntry[] {
  getPump(pumpId);
  const rng = createRng(`${pumpId}:stockhistory`);
  const sales = getSalesHistory(pumpId, days);
  const entries: StockHistoryEntry[] = [];

  sales.forEach((day) => {
    (["petrol", "diesel"] as FuelType[]).forEach((fuel) => {
      entries.push({
        id: `sold-${fuel}-${day.date}`,
        date: day.date,
        fuel,
        type: "sold",
        litres: fuel === "petrol" ? day.petrolLitres : day.dieselLitres,
        note: "Daily dispensed volume",
      });
    });
  });

  for (let i = days - 1; i >= 0; i -= rangeInt(rng, 4, 6)) {
    const date = daysAgo(i);
    (["petrol", "diesel"] as FuelType[]).forEach((fuel) => {
      if (rng() < 0.7) {
        entries.push({
          id: `recv-${fuel}-${isoDate(date)}`,
          date: isoDate(date),
          fuel,
          type: "received",
          litres: Math.round(range(rng, 7000, 12000)),
          note: `Tanker delivery — ${fuel === "petrol" ? "PMG 92" : "HSD"}`,
        });
      }
    });
  }

  if (rng() < 0.4) {
    entries.push({
      id: "adj-1",
      date: isoDate(daysAgo(rangeInt(rng, 1, days - 1))),
      fuel: pick(rng, ["petrol", "diesel"] as FuelType[]),
      type: "adjustment",
      litres: -Math.round(range(rng, 15, 60)),
      note: "Dip-reading correction",
    });
  }

  return entries.sort((a, b) => (a.date < b.date ? 1 : -1));
}

// ---------------------------------------------------------------------------
// Incoming tankers
// ---------------------------------------------------------------------------

const DRIVER_NAMES = [
  "Nasir Hussain",
  "Waqas Ali",
  "Shahid Mehmood",
  "Rizwan Sarwar",
  "Kamran Yousaf",
  "Zeeshan Butt",
];
const SUPPLIERS = ["PSO Depot", "Shell Terminal", "Attock Refinery", "Byco Terminal"];

export function getIncomingTankers(pumpId: string): IncomingTanker[] {
  getPump(pumpId);
  const rng = createRng(`${pumpId}:tankers:${isoDate(new Date())}`);
  const now = Date.now();

  const specs: { status: TankerStatus; hoursFromNow: number }[] = [
    { status: "arriving_soon", hoursFromNow: range(rng, 1.5, 4) },
    { status: "in_transit", hoursFromNow: range(rng, 6, 14) },
    { status: "scheduled", hoursFromNow: range(rng, 30, 60) },
    { status: "delayed", hoursFromNow: range(rng, -3, -0.5) },
    { status: "arrived", hoursFromNow: range(rng, -30, -20) },
  ];

  return specs.map((spec, i) => {
    const fuel: FuelType = i % 2 === 0 ? "petrol" : "diesel";
    return {
      id: `TNK-${pumpId.slice(-3)}-${i + 1}`,
      tankerNumber: `TK-${rangeInt(rng, 2000, 9999)}`,
      driverName: pick(rng, DRIVER_NAMES),
      driverPhone: `0300-${rangeInt(rng, 1000000, 9999999)}`,
      fuel,
      expectedLitres: Math.round(range(rng, 6000, 12000)),
      expectedArrival: new Date(now + spec.hoursFromNow * 3600 * 1000).toISOString(),
      status: spec.status,
      supplier: pick(rng, SUPPLIERS),
    };
  });
}

// ---------------------------------------------------------------------------
// Staff & attendance
// ---------------------------------------------------------------------------

const STAFF_TEMPLATE: { name: string; role: string }[] = [
  { name: "Tariq Javed", role: "Pump Attendant" },
  { name: "Sajid Iqbal", role: "Pump Attendant" },
  { name: "Naveed Aslam", role: "Pump Attendant" },
  { name: "Hamza Farooq", role: "Cashier" },
  { name: "Adeel Rasheed", role: "Cashier" },
  { name: "Faisal Qureshi", role: "Supervisor" },
  { name: "Junaid Akram", role: "Security Guard" },
  { name: "Rashid Mahmood", role: "Security Guard" },
  { name: "Imtiaz Gill", role: "Cleaner" },
];

const STAFF_COLORS = [
  "var(--series-1)",
  "var(--series-2)",
  "var(--series-3)",
  "var(--series-4)",
  "var(--series-5)",
  "var(--series-7)",
];

export function getStaff(pumpId: string): StaffMember[] {
  getPump(pumpId);
  const rng = createRng(`${pumpId}:staff`);
  return STAFF_TEMPLATE.map((template, i) => ({
    id: `STF-${pumpId.slice(-3)}-${i + 1}`,
    name: template.name,
    role: template.role,
    shift: SHIFTS[i % SHIFTS.length],
    phone: `0321-${rangeInt(rng, 1000000, 9999999)}`,
    joinedOn: isoDate(daysAgo(rangeInt(rng, 60, 900))),
    photoColor: STAFF_COLORS[i % STAFF_COLORS.length],
  }));
}

export const SHIFT_TIMES: Record<Shift, { start: string; end: string }> = {
  morning: { start: "06:00", end: "14:00" },
  evening: { start: "14:00", end: "22:00" },
  night: { start: "22:00", end: "06:00" },
};

function generateAttendanceForDate(pumpId: string, staff: StaffMember[], date: Date): AttendanceRecord[] {
  const dateStr = isoDate(date);
  return staff.map((member) => {
    const rng = createRng(`${pumpId}:attendance:${member.id}:${dateStr}`);
    const roll = rng();
    const status: AttendanceStatus = roll < 0.76 ? "present" : roll < 0.86 ? "late" : roll < 0.94 ? "absent" : "leave";
    const times = SHIFT_TIMES[member.shift];
    const hasTimes = status === "present" || status === "late";
    return {
      id: `ATT-${member.id}-${dateStr}`,
      staffId: member.id,
      date: dateStr,
      status,
      checkIn: hasTimes ? (status === "late" ? shiftTimeOffset(times.start, rangeInt(rng, 10, 45)) : times.start) : undefined,
      checkOut: hasTimes ? times.end : undefined,
    };
  });
}

function shiftTimeOffset(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor((total % (24 * 60)) / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function getAttendanceToday(pumpId: string): AttendanceRecord[] {
  const staff = getStaff(pumpId);
  return generateAttendanceForDate(pumpId, staff, daysAgo(0));
}

export function getAttendanceHistory(pumpId: string, days: number): AttendanceRecord[] {
  const staff = getStaff(pumpId);
  const records: AttendanceRecord[] = [];
  for (let i = 0; i < days; i++) {
    records.push(...generateAttendanceForDate(pumpId, staff, daysAgo(i)));
  }
  return records;
}

// ---------------------------------------------------------------------------
// Payments to company
// ---------------------------------------------------------------------------

export function getPaymentSummary(pumpId: string): PaymentSummary {
  getPump(pumpId);
  const rng = createRng(`${pumpId}:payments`);
  const last30 = getSalesHistory(pumpId, 30);
  const revenue30 = last30.reduce((sum, d) => sum + d.revenue, 0);

  const totalDueThisCycle = Math.round((revenue30 * range(rng, 0.024, 0.032) + 45000) / 100) * 100;
  const advancePaid = Math.round((totalDueThisCycle * range(rng, 0.25, 0.55)) / 100) * 100;
  const remainingDue = totalDueThisCycle - advancePaid;

  const history: PaymentRecord[] = [];
  let cursor = daysAgo(18);
  for (let i = 0; i < 7; i++) {
    const amount = Math.round((totalDueThisCycle * range(rng, 0.15, 0.4)) / 100) * 100;
    history.push({
      id: `PAY-${pumpId.slice(-3)}-${i + 1}`,
      date: isoDate(cursor),
      amount,
      method: pick(rng, ["cash", "card", "bank_transfer"] as const),
      note: i === 0 ? "Advance against current cycle" : "Monthly settlement installment",
      status: "completed",
    });
    cursor = new Date(cursor.getTime() - rangeInt(rng, 14, 26) * 86400000);
  }
  history.sort((a, b) => (a.date < b.date ? 1 : -1));

  return {
    totalDueThisCycle,
    advancePaid,
    remainingDue,
    nextDueDate: isoDate(new Date(Date.now() + rangeInt(rng, 3, 15) * 86400000)),
    totalPaidAllTime: history.reduce((sum, p) => sum + p.amount, 0) + Math.round(revenue30 * 4.2),
    history,
  };
}

// ---------------------------------------------------------------------------
// Connect & chat directory
// ---------------------------------------------------------------------------

export function getDirectory(currentOwnerId: string): DirectoryOwner[] {
  const rng = createRng(`directory:${currentOwnerId}`);
  const statuses = ["none", "none", "pending_sent", "pending_received", "connected"] as const;
  return PUMPS.filter((p) => p.ownerId !== currentOwnerId).map((pump, i) => ({
    ownerId: pump.ownerId,
    ownerName: pump.ownerName,
    pumpName: pump.name,
    city: pump.city,
    avatarColor: pump.avatarColor,
    online: pump.online,
    connectionStatus: statuses[i % statuses.length] || pick(rng, statuses),
  }));
}
