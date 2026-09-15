import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, type Column } from "@/components/ui/Table";
import { getAdminSession } from "@/lib/admin/session";
import { PUMPS, getStaff } from "@/lib/demo-data";
import { simulateLatency } from "@/lib/utils";

interface Employee {
  id: string;
  name: string;
  role: string;
  pumpId: string;
  pumpName: string;
  shift: string;
  phone: string;
  joinDate: string;
}

export default async function EmployeesPage() {
  await simulateLatency();
  const session = await getAdminSession();

  // Collect all employees from all pumps
  const employees: Employee[] = [];

  PUMPS.forEach((pump) => {
    const staff = getStaff(pump.id);
    staff.forEach((member) => {
      employees.push({
        id: member.id,
        name: member.name,
        role: member.role,
        pumpId: pump.id,
        pumpName: pump.name,
        shift: member.shift,
        phone: member.phone,
        joinDate: member.joinedOn,
      });
    });
  });

  const columns: Column<Employee>[] = [
    { header: "Name", cell: (row) => <span className="font-medium text-ink-primary">{row.name}</span> },
    { header: "Role", cell: (row) => <Badge tone="warning">{row.role}</Badge> },
    { header: "Pump", cell: (row) => row.pumpName },
    { header: "Shift", cell: (row) => <span className="text-sm text-ink-secondary">{row.shift}</span> },
    { header: "Phone", cell: (row) => <span className="text-sm text-ink-secondary">{row.phone}</span> },
    { header: "Join Date", cell: (row) => <span className="text-sm text-ink-secondary">{new Date(row.joinDate).toLocaleDateString()}</span> },
  ];

  return (
    <div>
      <PageHeader
        title="Employee Management"
        description="View and manage all employees across your pump network. Monitor roles, assignments, and contact information."
      />

      <Card>
        <CardHeader title="All Employees" subtitle={`${employees.length} employees in the system`} />
        <Table columns={columns} rows={employees} rowKey={(row) => row.id} />
      </Card>
    </div>
  );
}
