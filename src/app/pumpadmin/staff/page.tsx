import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { StaffDirectory } from "@/components/dashboard/StaffDirectory";
import { AttendanceHistory } from "@/components/dashboard/AttendanceHistory";
import { IconUsers, IconClock, IconAlertTriangle } from "@/components/icons";
import { getSession } from "@/lib/session";
import { getAttendanceHistory, getAttendanceToday, getStaff } from "@/lib/demo-data";
import { simulateLatency } from "@/lib/utils";

export default async function StaffPage() {
  await simulateLatency();
  const session = await getSession();
  const staff = getStaff(session.pumpId);
  const attendanceToday = getAttendanceToday(session.pumpId);
  const history = getAttendanceHistory(session.pumpId, 14);

  const present = attendanceToday.filter((a) => a.status === "present" || a.status === "late").length;
  const absent = attendanceToday.filter((a) => a.status === "absent").length;
  const onLeave = attendanceToday.filter((a) => a.status === "leave").length;

  return (
    <div>
      <PageHeader title="Staff" description="Your pump's employees, shifts and daily attendance." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Total employees" value={String(staff.length)} icon={<IconUsers size={19} />} accent="var(--brand-500)" />
        <KpiCard label="Present today" value={`${present} / ${staff.length}`} icon={<IconClock size={19} />} accent="var(--status-good)" />
        <KpiCard
          label="Absent / on leave"
          value={String(absent + onLeave)}
          hint={`${absent} absent · ${onLeave} on leave`}
          icon={<IconAlertTriangle size={19} />}
          accent={absent > 0 ? "var(--status-critical)" : "var(--brand-500)"}
        />
      </div>

      <Card className="mt-4">
        <CardHeader title="Pump employees" subtitle="Roster, shift timing and today's attendance" />
        <StaffDirectory staff={staff} attendanceToday={attendanceToday} />
      </Card>

      <Card className="mt-4">
        <CardHeader title="Staff history" subtitle="Attendance record for the last 14 days, per employee" />
        <AttendanceHistory staff={staff} history={history} />
      </Card>
    </div>
  );
}
