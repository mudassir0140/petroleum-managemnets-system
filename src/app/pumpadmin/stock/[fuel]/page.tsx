import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { loadFuelLedger } from "@/lib/db/fuel-ledger";
import { BackButton } from "@/components/dashboard/BackButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { EmptyState } from "@/components/ui/States";
import { IconArrowLeft, IconCalendar, IconChevronRight, IconDroplet, IconTruck } from "@/components/icons";
import {
  currentMonth,
  formatLitreValue,
  isValidMonth,
  monthStock,
  shiftMonth,
} from "@/lib/stock/ledger";

// Stock is read live from MongoDB on every request.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const FUEL = {
  petrol: { en: "Petrol", ur: "پیٹرول", accent: "var(--fuel-petrol)" },
  diesel: { en: "Diesel", ur: "ڈیزل", accent: "var(--fuel-diesel)" },
} as const;

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-10" -> "October 2026"
function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

// "2026-10-05" -> "5 Oct" (string based, so the server timezone cannot shift the day)
function dayLabel(date: string): string {
  const [, m, d] = date.split("-").map(Number);
  return `${d} ${MONTH_SHORT[m - 1]}`;
}

export default async function FuelStockMonthPage({
  params,
  searchParams,
}: {
  params: Promise<{ fuel: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { fuel } = await params;
  if (fuel !== "petrol" && fuel !== "diesel") notFound();
  const labels = FUEL[fuel];

  const { month: monthParam } = await searchParams;
  const session = await getSession();
  const ledger = await loadFuelLedger(session.pumpId, fuel);

  const thisMonth = currentMonth();
  const month = isValidMonth(monthParam) && monthParam <= thisMonth ? monthParam : thisMonth;
  const stock = monthStock(ledger, month);
  const prevMonth = shiftMonth(month, -1);
  const nextMonth = shiftMonth(month, 1);
  const base = `/pumpadmin/stock/${fuel}`;

  return (
    <div>
      <BackButton href="/pumpadmin" />
      <PageHeader
        title={`${labels.en} Stock / ${labels.ur} اسٹاک`}
        description={`Full month: opening stock, deliveries, sales and closing stock — ${monthLabel(month)}`}
      />

      <Card className="mb-6">
        <div className="flex items-center justify-between gap-3 p-4">
          <Link
            href={`${base}?month=${prevMonth}`}
            className="inline-flex items-center gap-2 rounded-lg border border-border-subtle px-3 py-2 text-sm font-medium text-ink-primary hover:bg-surface-2"
          >
            <IconArrowLeft size={16} />
            Previous / پچھلا
          </Link>
          <div className="text-center">
            <p className="text-xs text-ink-muted">Month / مہینہ</p>
            <p className="text-base font-semibold text-ink-primary">{monthLabel(month)}</p>
          </div>
          {month < thisMonth ? (
            <Link
              href={`${base}?month=${nextMonth}`}
              className="inline-flex items-center gap-2 rounded-lg border border-border-subtle px-3 py-2 text-sm font-medium text-ink-primary hover:bg-surface-2"
            >
              Next / اگلا
              <IconChevronRight size={16} />
            </Link>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-lg border border-border-subtle px-3 py-2 text-sm font-medium text-ink-muted opacity-50">
              Next / اگلا
              <IconChevronRight size={16} />
            </span>
          )}
        </div>
      </Card>

      <div className="mb-6 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <KpiCard label="Opening stock / ابتدائی اسٹاک" value={formatLitreValue(stock.opening)} icon={<IconDroplet size={14} />} accent={labels.accent} compact />
        <KpiCard label="Litres received / موصول لیٹر" value={formatLitreValue(stock.totalReceived)} icon={<IconTruck size={14} />} accent="var(--series-2)" compact />
        <KpiCard label="Litres sold / فروخت لیٹر" value={formatLitreValue(stock.totalSold)} icon={<IconDroplet size={14} />} accent="var(--series-7)" compact />
        <KpiCard label="Closing stock / آخری اسٹاک" value={formatLitreValue(stock.closing)} icon={<IconDroplet size={14} />} accent={labels.accent} compact />
      </div>

      {!stock.hasMovement ? (
        <EmptyState
          icon={<IconCalendar size={22} />}
          title="No stock movement this month / اس مہینے کوئی اسٹاک حرکت نہیں"
          description={`No deliveries or sales were recorded for ${labels.en.toLowerCase()} in ${monthLabel(month)}.`}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Litres received / موصول شدہ لیٹر" subtitle="Delivered orders, by delivery date" />
            {stock.receipts.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-ink-muted">No deliveries this month / اس مہینے کوئی ترسیل نہیں</p>
            ) : (
              <div className="overflow-x-auto px-5 pb-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle text-left text-xs text-ink-muted">
                      <th className="py-2 font-medium">Delivery date / تاریخ</th>
                      <th className="py-2 text-right font-medium">Litres / لیٹر</th>
                      <th className="py-2 font-medium">Tracking / ٹریکنگ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stock.receipts.map((r) => (
                      <tr key={r.id} className="border-b border-border-subtle last:border-0">
                        <td className="py-2 text-ink-primary">{dayLabel(r.date)}</td>
                        <td className="py-2 text-right font-semibold text-ink-primary">{formatLitreValue(r.litres)}</td>
                        <td className="py-2 text-ink-secondary">{r.trackingNumber || r.driverName || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Sold per day and closing stock / روزانہ فروخت اور اسٹاک" subtitle="Shift sales from attendant meter readings" />
            <div className="overflow-x-auto px-5 pb-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-left text-xs text-ink-muted">
                    <th className="py-2 font-medium">Date / تاریخ</th>
                    <th className="py-2 text-right font-medium">Received</th>
                    <th className="py-2 text-right font-medium">Sold / فروخت</th>
                    <th className="py-2 text-right font-medium">Closing / آخری</th>
                  </tr>
                </thead>
                <tbody>
                  {stock.days.map((d) => (
                    <tr key={d.date} className={`border-b border-border-subtle last:border-0 ${d.sold === 0 && d.received === 0 ? "text-ink-muted" : "text-ink-primary"}`}>
                      <td className="py-2">{dayLabel(d.date)}</td>
                      <td className="py-2 text-right">{d.received ? formatLitreValue(d.received) : "—"}</td>
                      <td className="py-2 text-right">{d.sold ? formatLitreValue(d.sold) : "—"}</td>
                      <td className="py-2 text-right font-semibold">{formatLitreValue(d.closing)}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold text-ink-primary">
                    <td className="py-2">Total / کل</td>
                    <td className="py-2 text-right">{formatLitreValue(stock.totalReceived)}</td>
                    <td className="py-2 text-right">{formatLitreValue(stock.totalSold)}</td>
                    <td className="py-2 text-right">{formatLitreValue(stock.closing)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
