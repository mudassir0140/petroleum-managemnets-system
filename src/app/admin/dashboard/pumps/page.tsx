import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, type Column } from "@/components/ui/Table";
import { EditIcon, PlusIcon } from "@/components/icons";
import { getAdminSession } from "@/lib/admin/session";
import { PUMPS } from "@/lib/demo-data";
import { simulateLatency } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import type { Pump } from "@/lib/manager/types";
import { AdminPumpForm } from "@/components/admin/PumpForm";

export default async function PumpManagementPage() {
  await simulateLatency();
  const session = await getAdminSession();

  const rows: Pump[] = PUMPS as unknown as Pump[];

  const columns: Column<Pump>[] = [
    { header: "Pump Name", cell: (row) => <span className="font-medium text-ink-primary">{row.name}</span> },
    { header: "Code", cell: (row) => <span className="font-mono text-sm text-ink-secondary">{row.code || "N/A"}</span> },
    { header: "Owner", cell: (row) => row.ownerName },
    { header: "Location", cell: (row) => row.address ? `${row.address}, ${row.city}` : row.city },
    { header: "Status", cell: (row) => <Badge tone={row.status === "open" ? "good" : row.status === "low-stock" ? "warning" : "critical"}>{row.status}</Badge> },
    { header: "Phone", cell: (row) => <span className="text-sm text-ink-secondary">{row.ownerPhone || "N/A"}</span> },
  ];

  return (
    <div>
      <PageHeader
        title="Pump Management"
        description="Create, edit, and manage all pumps in your network. Assign staff, monitor status, and manage fuel inventory."
      />

      <div className="mb-6 flex justify-end">
        <AdminPumpForm mode="create" onSuccess={() => {}} />
      </div>

      <Card>
        <CardHeader title="All Pumps" subtitle={`Manage ${rows.length} pumps in the system`} />
        <Table columns={columns} rows={rows} rowKey={(row) => row.id} />
      </Card>
    </div>
  );
}
