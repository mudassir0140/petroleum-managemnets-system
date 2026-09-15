import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, type Column } from "@/components/ui/Table";
import { getAdminSession } from "@/lib/admin/session";
import { simulateLatency } from "@/lib/utils";

interface Role {
  id: string;
  name: string;
  description: string;
  usersCount: number;
  permissions: string;
  status: "active" | "inactive";
}

export default async function RolesPage() {
  await simulateLatency();
  const session = await getAdminSession();

  const roles: Role[] = [
    {
      id: "ROLE-001",
      name: "Company Admin",
      description: "Full system access and control",
      usersCount: 2,
      permissions: "All",
      status: "active",
    },
    {
      id: "ROLE-002",
      name: "Finance Manager",
      description: "Payments, invoices, and financial reports",
      usersCount: 3,
      permissions: "Finance, Reports",
      status: "active",
    },
    {
      id: "ROLE-003",
      name: "Pump Manager",
      description: "Pump operations and staff management",
      usersCount: 8,
      permissions: "Pumps, Staff, Sales",
      status: "active",
    },
    {
      id: "ROLE-004",
      name: "Logistics Manager",
      description: "Tanker fleet, drivers, and deliveries",
      usersCount: 2,
      permissions: "Tankers, Drivers, Routes",
      status: "active",
    },
    {
      id: "ROLE-005",
      name: "HR Manager",
      description: "Employee and payroll management",
      usersCount: 1,
      permissions: "Employees, Payroll, Attendance",
      status: "active",
    },
  ];

  const columns: Column<Role>[] = [
    { header: "Role Name", cell: (row) => <span className="font-medium text-ink-primary">{row.name}</span> },
    { header: "Description", cell: (row) => <span className="text-sm text-ink-secondary">{row.description}</span> },
    { header: "Permissions", cell: (row) => <span className="text-xs text-ink-secondary">{row.permissions}</span> },
    { header: "Users", cell: (row) => <span className="font-semibold text-brand-500">{row.usersCount}</span> },
    { header: "Status", cell: (row) => <Badge tone={row.status === "active" ? "good" : "neutral"}>{row.status}</Badge> },
  ];

  return (
    <div>
      <PageHeader
        title="Company Roles Management"
        description="Create and manage company roles, assign permissions, and control access levels for all users."
      />

      <Card>
        <CardHeader title="Roles" subtitle={`${roles.length} roles configured in system`} />
        <Table columns={columns} rows={roles} rowKey={(row) => row.id} />
      </Card>
    </div>
  );
}
