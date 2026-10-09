import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";

export default function AttendancePage() {
  return (
    <div>
      <PageHeader
        title="Attendance / حاضری"
        description="View and manage employee attendance records"
      />

      <Card>
        <CardHeader title="Attendance Records" />
        <div className="p-6 text-center text-slate-500 dark:text-slate-400">
          <p>Attendance data will be displayed here.</p>
        </div>
      </Card>
    </div>
  );
}
