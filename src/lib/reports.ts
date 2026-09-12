import type { DailySales } from "@/lib/types";

export interface ReportRow {
  period: string;
  petrolLitres: number;
  dieselLitres: number;
  cashRevenue: number;
  cardRevenue: number;
  revenue: number;
}

function sumRows(days: DailySales[], period: string): ReportRow {
  return {
    period,
    petrolLitres: days.reduce((s, d) => s + d.petrolLitres, 0),
    dieselLitres: days.reduce((s, d) => s + d.dieselLitres, 0),
    cashRevenue: days.reduce((s, d) => s + d.cashRevenue, 0),
    cardRevenue: days.reduce((s, d) => s + d.cardRevenue, 0),
    revenue: days.reduce((s, d) => s + d.revenue, 0),
  };
}

export function buildDailyRows(history: DailySales[]): ReportRow[] {
  return history
    .map((d) =>
      sumRows(
        [d],
        new Date(d.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", weekday: "short" }),
      ),
    )
    .reverse();
}

export function buildWeeklyRows(history: DailySales[]): ReportRow[] {
  const weeks: DailySales[][] = [];
  for (let i = history.length; i > 0; i -= 7) {
    weeks.push(history.slice(Math.max(0, i - 7), i));
  }
  return weeks
    .filter((w) => w.length > 0)
    .map((w, idx, arr) => {
      const label = `${new Date(w[0].date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} – ${new Date(
        w[w.length - 1].date,
      ).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`;
      const isCurrent = idx === arr.length - 1;
      return sumRows(w, isCurrent ? `${label} (current week)` : label);
    })
    .reverse();
}

export function buildMonthlyRows(history: DailySales[]): ReportRow[] {
  const byMonth = new Map<string, DailySales[]>();
  for (const day of history) {
    const key = day.date.slice(0, 7);
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(day);
  }
  return Array.from(byMonth.entries())
    .map(([key, days]) => {
      const label = new Date(`${key}-01`).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
      return sumRows(days, label);
    })
    .reverse();
}

export function rowsToCsv(headers: string[], rows: (string | number)[][]): string {
  const escape = (value: string | number) => {
    const str = String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  return [headers.map(escape).join(","), ...rows.map((row) => row.map(escape).join(","))].join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
