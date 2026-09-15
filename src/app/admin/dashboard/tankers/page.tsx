import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, type Column } from "@/components/ui/Table";
import { getAdminSession } from "@/lib/admin/session";
import { simulateLatency } from "@/lib/utils";

interface Tanker {
  id: string;
  regNumber: string;
  capacity: number;
  status: "available" | "in-transit" | "maintenance";
  driver?: string;
  lastMaintenance: string;
}

interface Driver {
  id: string;
  name: string;
  licenseNo: string;
  phone: string;
  assignedTanker?: string;
  status: "available" | "on-trip" | "off-duty";
}

export default async function TankersPage() {
  await simulateLatency();
  const session = await getAdminSession();

  const tankers: Tanker[] = [
    { id: "TK-001", regNumber: "PK-2023-001", capacity: 30000, status: "available", lastMaintenance: "2024-09-01", driver: "Ahmed Khan" },
    { id: "TK-002", regNumber: "PK-2023-002", capacity: 30000, status: "in-transit", lastMaintenance: "2024-08-15", driver: "Hassan Ali" },
    { id: "TK-003", regNumber: "PK-2023-003", capacity: 25000, status: "maintenance", lastMaintenance: "2024-09-10" },
  ];

  const drivers: Driver[] = [
    { id: "DR-001", name: "Ahmed Khan", licenseNo: "DL-2024-001", phone: "03001234567", assignedTanker: "TK-001", status: "available" },
    { id: "DR-002", name: "Hassan Ali", licenseNo: "DL-2024-002", phone: "03001234568", assignedTanker: "TK-002", status: "on-trip" },
    { id: "DR-003", name: "Faisal Ahmed", licenseNo: "DL-2024-003", phone: "03001234569", status: "off-duty" },
  ];

  const tankerColumns: Column<Tanker>[] = [
    { header: "Tanker ID", cell: (row) => <span className="font-medium text-ink-primary">{row.regNumber}</span> },
    { header: "Capacity", cell: (row) => <span className="text-sm text-ink-secondary">{row.capacity.toLocaleString()} L</span> },
    { header: "Status", cell: (row) => <Badge tone={row.status === "available" ? "good" : row.status === "in-transit" ? "warning" : "neutral"}>{row.status}</Badge> },
    { header: "Driver", cell: (row) => <span className="text-sm text-ink-secondary">{row.driver || "Unassigned"}</span> },
    { header: "Last Maintenance", cell: (row) => <span className="text-sm text-ink-secondary">{new Date(row.lastMaintenance).toLocaleDateString()}</span> },
  ];

  const driverColumns: Column<Driver>[] = [
    { header: "Driver Name", cell: (row) => <span className="font-medium text-ink-primary">{row.name}</span> },
    { header: "License No", cell: (row) => <span className="text-sm text-ink-secondary">{row.licenseNo}</span> },
    { header: "Phone", cell: (row) => <span className="text-sm text-ink-secondary">{row.phone}</span> },
    { header: "Assigned Tanker", cell: (row) => <span className="text-sm text-ink-secondary">{row.assignedTanker || "None"}</span> },
    { header: "Status", cell: (row) => <Badge tone={row.status === "available" ? "good" : row.status === "on-trip" ? "warning" : "neutral"}>{row.status}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tankers & Drivers Management"
        description="Manage tanker fleet, driver assignments, maintenance schedules, and delivery routes."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Tanker Fleet" subtitle={`${tankers.length} tankers in system`} />
          <Table columns={tankerColumns} rows={tankers} rowKey={(row) => row.id} />
        </Card>

        <Card>
          <CardHeader title="Drivers" subtitle={`${drivers.length} drivers in system`} />
          <Table columns={driverColumns} rows={drivers} rowKey={(row) => row.id} />
        </Card>
      </div>
    </div>
  );
}
