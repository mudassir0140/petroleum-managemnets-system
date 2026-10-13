// Employee shift records (owner-managed Start / End Shift) and the Daily,
// Weekly, Monthly and Overall summaries built from them. Pure functions, no
// server imports, so the API route and the tests share the same rules.

export interface ShiftRecord {
  id: string;
  date: string; // YYYY-MM-DD (Pakistan day the shift started)
  status: "active" | "completed";
  startedAt: string; // ISO
  scheduledEndAt: string; // ISO = startedAt + assigned shift hours
  endedAt?: string; // ISO
  workedMinutes?: number;
  shiftHours: number;
}

export interface PeriodSummary {
  days: number; // distinct days with a shift
  shifts: number;
  hours: number; // completed shifts only, 1 decimal
}

export interface ShiftSummary {
  today: string;
  daily: PeriodSummary;
  weekly: PeriodSummary; // last 7 days including today
  monthly: PeriodSummary; // current calendar month
  overall: PeriodSummary;
}

const KARACHI_DAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit" });

// YYYY-MM-DD in Pakistan time.
export function dayKey(value: Date | string | number): string {
  return KARACHI_DAY.format(value instanceof Date ? value : new Date(value));
}

// Given the start time and assigned hours, the shift is complete at start + hours.
export function scheduledEnd(startedAt: Date, shiftHours: number): Date {
  return new Date(startedAt.getTime() + shiftHours * 60 * 60 * 1000);
}

export function summarizeShifts(records: ShiftRecord[], now: Date = new Date()): ShiftSummary {
  const today = dayKey(now);
  const month = today.slice(0, 7);
  const weekStart = dayKeyOffset(today, -6);

  const period = (filter: (r: ShiftRecord) => boolean): PeriodSummary => {
    const subset = records.filter(filter);
    const days = new Set(subset.map((r) => r.date)).size;
    const minutes = subset
      .filter((r) => r.status === "completed")
      .reduce((sum, r) => sum + (r.workedMinutes ?? 0), 0);
    return { days, shifts: subset.length, hours: Math.round((minutes / 60) * 10) / 10 };
  };

  return {
    today,
    daily: period((r) => r.date === today),
    weekly: period((r) => r.date >= weekStart && r.date <= today),
    monthly: period((r) => r.date.startsWith(month)),
    overall: period(() => true),
  };
}

// "2026-10-13" + (-6) -> "2026-10-07"
export function dayKeyOffset(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
}

// "1h 05m" for display
export function formatWorked(minutes: number | undefined): string {
  const total = Math.max(0, Math.round(minutes ?? 0));
  return `${Math.floor(total / 60)}h ${String(total % 60).padStart(2, "0")}m`;
}
