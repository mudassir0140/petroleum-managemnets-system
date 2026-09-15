import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, type Column } from "@/components/ui/Table";
import { getAdminSession } from "@/lib/admin/session";
import { PUMPS } from "@/lib/demo-data";
import { simulateLatency } from "@/lib/utils";
import type { Pump } from "@/lib/manager/types";

interface PumpOwner {
  id: string;
  name: string;
  email: string;
  phone: string;
  pumpCount: number;
  status: "active" | "inactive";
}

export default async function PumpOwnersPage() {
  await simulateLatency();
  const session = await getAdminSession();

  // Group pumps by owner to create unique owner records
  const ownerMap = new Map<string, PumpOwner>();

  (PUMPS as unknown as Pump[]).forEach((pump) => {
    if (!ownerMap.has(pump.ownerId)) {
      ownerMap.set(pump.ownerId, {
        id: pump.ownerId,
        name: pump.ownerName,
        email: pump.ownerName,
        phone: pump.ownerPhone,
        pumpCount: 0,
        status: "active",
      });
    }
    const owner = ownerMap.get(pump.ownerId)!;
    owner.pumpCount += 1;
  });

  const owners = Array.from(ownerMap.values());

  const columns: Column<PumpOwner>[] = [
    { header: "Owner Name", cell: (row) => <span className="font-medium text-ink-primary">{row.name}</span> },
    { header: "Email", cell: (row) => <span className="text-sm text-ink-secondary">{row.email}</span> },
    { header: "Phone", cell: (row) => <span className="text-sm text-ink-secondary">{row.phone}</span> },
    { header: "Pumps Assigned", cell: (row) => <span className="font-semibold text-brand-500">{row.pumpCount}</span> },
    { header: "Status", cell: (row) => <Badge tone={row.status === "active" ? "good" : "neutral"}>{row.status}</Badge> },
  ];

  return (
    <div>
      <PageHeader
        title="Pump Owners"
        description="Manage pump owners and view their assigned pumps and account details."
      />

      <Card>
        <CardHeader title="Pump Owners" subtitle={`${owners.length} pump owners in the system`} />
        <Table columns={columns} rows={owners} rowKey={(row) => row.id} />
      </Card>
    </div>
  );
}
