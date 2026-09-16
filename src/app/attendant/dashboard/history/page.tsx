import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, type Column } from "@/components/ui/Table";
import { IconCalendar, IconTrendingUp, IconUsers } from "@/components/icons";
import { getAttendantSession } from "@/lib/attendant/session";
import { getClosingReportHistory, getDailySalesHistory, getShiftHistory, getShiftLog } from "@/lib/attendant/shift-store";
import { simulateLatency } from "@/lib/utils";
import { formatCurrency, formatDate, formatDateTime, formatLitresCompact, titleCase } from "@/lib/format";
import type { ClosingReport, DailySalesSummary, ShiftLog } from "@/lib/attendant/types";

export default async function AttendantHistoryPage() {
  await simulateLatency();
  const session = await getAttendantSession();

  const shifts = await getShiftHistory(session.attendantId, 30);
  const dailySales = await getDailySalesHistory(session.attendantId, 30);
  const reports = await getClosingReportHistory(session.attendantId, 30);

  // Pre-load all shift logs for the report columns
  const shiftLogsMap = new Map<string, any>();
  for (const report of reports) {
    const shift = await getShiftLog(report.shiftLogId);
    if (shift) {
      shiftLogsMap.set(report.shiftLogId, shift);
    }
  }

  const shiftsWorked = shifts.filter((s) => s.status === "closed").length;
  const totalLitres30d = dailySales.reduce((sum, d) => sum + d.petrolLitres + d.dieselLitres, 0);
  const totalRevenue30d = dailySales.reduce((sum, d) => sum + d.revenueTotal, 0);

  const shiftColumns: Column<ShiftLog>[] = [
    { header: "Date", cell: (row) => formatDate(row.date) },
    { header: "Shift", cell: (row) => titleCase(row.shift) },
    { header: "Status", cell: (row) => <Badge tone={row.status === "active" ? "good" : "neutral"}>{titleCase(row.status)}</Badge> },
    { header: "Started", cell: (row) => formatDateTime(row.startedAt) },
    { header: "Ended", cell: (row) => (row.endedAt ? formatDateTime(row.endedAt) : "—") },
  ];

  const salesColumns: Column<DailySalesSummary>[] = [
    { header: "Date", cell: (row) => formatDate(row.date) },
    { header: "Petrol", align: "right", cell: (row) => formatLitresCompact(row.petrolLitres) },
    { header: "Diesel", align: "right", cell: (row) => formatLitresCompact(row.dieselLitres) },
    { header: "Cash", align: "right", cell: (row) => formatCurrency(row.cashTotal) },
    { header: "Card", align: "right", cell: (row) => formatCurrency(row.cardTotal) },
    { header: "Revenue", align: "right", cell: (row) => <span className="font-semibold">{formatCurrency(row.revenueTotal)}</span> },
  ];

  const reportColumns: Column<ClosingReport>[] = [
    {
      header: "Shift",
      cell: (row) => {
        const shift = shiftLogsMap.get(row.shiftLogId);
        return shift ? `${formatDate(shift.date)} · ${titleCase(shift.shift)}` : "—";
      },
    },
    { header: "Submitted", cell: (row) => formatDateTime(row.submittedAt) },
    { header: "Expected cash", align: "right", cell: (row) => formatCurrency(row.cashTotal) },
    { header: "Counted", align: "right", cell: (row) => formatCurrency(row.cashCounted) },
    {
      header: "Variance",
      align: "right",
      cell: (row) => (
        <span style={{ color: row.variance === 0 ? undefined : row.variance > 0 ? "var(--status-good-text)" : "var(--status-critical)" }}>
          {row.variance > 0 ? "+" : ""}
          {formatCurrency(row.variance)}
        </span>
      ),
    },
    { header: "Notes", cell: (row) => <span className="text-ink-muted">{row.notes || "—"}</span> },
  ];

  return (
    <div>
      <PageHeader title="Attendance & History" description="Your own shift attendance, daily sales and closing reports." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Shifts completed" value={String(shiftsWorked)} icon={<IconUsers size={19} />} accent="var(--brand-500)" />
        <KpiCard label="Litres (30 days)" value={formatLitresCompact(totalLitres30d)} icon={<IconCalendar size={19} />} accent="var(--fuel-petrol)" />
        <KpiCard label="Revenue (30 days)" value={formatCurrency(totalRevenue30d)} icon={<IconTrendingUp size={19} />} accent="var(--series-7)" />
      </div>

      <Card className="mt-4">
        <CardHeader title="Attendance" subtitle="Every shift you've started, most recent first" />
        <Table columns={shiftColumns} rows={shifts} rowKey={(row) => row.id} emptyMessage="You haven't started a shift yet." />
      </Card>

      <Card className="mt-4">
        <CardHeader title="Daily sales" subtitle="Your own logged sales — last 30 days" />
        <Table columns={salesColumns} rows={dailySales} rowKey={(row) => row.date} emptyMessage="No sales logged yet." />
      </Card>

      <Card className="mt-4">
        <CardHeader title="Shift closing reports" subtitle="Cash reconciliation submitted at the end of each shift" />
        <Table columns={reportColumns} rows={reports} rowKey={(row) => row.id} emptyMessage="No shift has been closed yet." />
      </Card>
    </div>
  );
}
