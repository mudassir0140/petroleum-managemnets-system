import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, type Column } from "@/components/ui/Table";
import { getAdminSession } from "@/lib/admin/session";
import { simulateLatency } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive" | "suspended";
  lastLogin: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  rolesCount: number;
}

export default async function AccessControlPage() {
  await simulateLatency();
  const session = await getAdminSession();

  const users: User[] = [
    { id: "USR-001", name: "Ali Raza", email: "admin@petromanage.demo", role: "Admin", status: "active", lastLogin: "2024-09-14" },
    { id: "USR-002", name: "Fatima Khan", email: "finance@petromanage.demo", role: "Finance Manager", status: "active", lastLogin: "2024-09-13" },
    { id: "USR-003", name: "Muhammad Hassan", email: "logistics@petromanage.demo", role: "Logistics Manager", status: "active", lastLogin: "2024-09-12" },
    { id: "USR-004", name: "Ayesha Ahmed", email: "hr@petromanage.demo", role: "HR Manager", status: "inactive", lastLogin: "2024-09-05" },
  ];

  const permissions: Permission[] = [
    { id: "PERM-001", name: "View Dashboard", description: "Access to admin dashboard", rolesCount: 5 },
    { id: "PERM-002", name: "Manage Pumps", description: "Create, edit, delete pumps", rolesCount: 2 },
    { id: "PERM-003", name: "Manage Finance", description: "Access financial management", rolesCount: 2 },
    { id: "PERM-004", name: "Manage Users", description: "Create and manage user accounts", rolesCount: 1 },
    { id: "PERM-005", name: "View Reports", description: "Access all system reports", rolesCount: 3 },
  ];

  const userColumns: Column<User>[] = [
    { header: "Name", cell: (row) => <span className="font-medium text-ink-primary">{row.name}</span> },
    { header: "Email", cell: (row) => <span className="text-sm text-ink-secondary">{row.email}</span> },
    { header: "Role", cell: (row) => <Badge tone="warning">{row.role}</Badge> },
    { header: "Status", cell: (row) => <Badge tone={row.status === "active" ? "good" : row.status === "inactive" ? "neutral" : "critical"}>{row.status}</Badge> },
    { header: "Last Login", cell: (row) => <span className="text-sm text-ink-secondary">{new Date(row.lastLogin).toLocaleDateString()}</span> },
  ];

  const permissionColumns: Column<Permission>[] = [
    { header: "Permission", cell: (row) => <span className="font-medium text-ink-primary">{row.name}</span> },
    { header: "Description", cell: (row) => <span className="text-sm text-ink-secondary">{row.description}</span> },
    { header: "Roles", cell: (row) => <span className="font-semibold text-brand-500">{row.rolesCount}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Access Control & Permissions"
        description="Manage user accounts, roles, and permissions to control system access."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="System Users" subtitle={`${users.length} users in system`} />
          <Table columns={userColumns} rows={users} rowKey={(row) => row.id} />
        </Card>

        <Card>
          <CardHeader title="Permissions" subtitle={`${permissions.length} permissions available`} />
          <Table columns={permissionColumns} rows={permissions} rowKey={(row) => row.id} />
        </Card>
      </div>
    </div>
  );
}
