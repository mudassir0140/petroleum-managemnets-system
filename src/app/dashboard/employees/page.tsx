import { PageHeader } from "@/components/ui/PageHeader";

export default function EmployeesOverviewPage() {
  return (
    <div>
      <PageHeader
        title="Employees & Attendance"
        description="Manage employee records, attendance, and payroll"
      />
      <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Use the sidebar to navigate to employee management sections.
        </p>
      </div>
    </div>
  );
}
