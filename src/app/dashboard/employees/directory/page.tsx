import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";

export default function DirectoryPage() {
  return (
    <div>
      <PageHeader
        title="Directory / فہرست"
        description="Employee directory and contact information"
      />

      <Card>
        <CardHeader title="Employee Directory" />
        <div className="p-6 text-center text-slate-500 dark:text-slate-400">
          <p>Employee directory will be displayed here.</p>
        </div>
      </Card>
    </div>
  );
}
