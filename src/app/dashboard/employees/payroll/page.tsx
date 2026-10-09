import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";

export default function PayrollPage() {
  return (
    <div>
      <PageHeader
        title="Payroll / تنخواہیں"
        description="Manage employee payroll and compensation"
      />

      <Card>
        <CardHeader title="Payroll Records" />
        <div className="p-6 text-center text-slate-500 dark:text-slate-400">
          <p>Payroll data will be displayed here.</p>
        </div>
      </Card>
    </div>
  );
}
