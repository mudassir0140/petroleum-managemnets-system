import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { Badge } from "@/components/ui/Badge";
import { Table, type Column } from "@/components/ui/Table";
import { SettingsIcon, ShieldCheckIcon, TankIcon, ClockIcon } from "@/components/icons";
import { getAdminSession } from "@/lib/admin/session";
import { PUMPS } from "@/lib/demo-data";
import { simulateLatency } from "@/lib/utils";

interface SystemMetric {
  name: string;
  value: string;
  status: "healthy" | "warning" | "critical";
}

export default async function SystemSettingsPage() {
  await simulateLatency();
  const session = await getAdminSession();

  const systemMetrics: SystemMetric[] = [
    { name: "Total Pumps", value: PUMPS.length.toString(), status: "healthy" },
    { name: "Active Users", value: "24", status: "healthy" },
    { name: "System Uptime", value: "99.8%", status: "healthy" },
    { name: "Average Response Time", value: "245ms", status: "healthy" },
  ];

  const columns: Column<SystemMetric>[] = [
    { header: "Metric", cell: (row) => <span className="font-medium text-ink-primary">{row.name}</span> },
    { header: "Value", cell: (row) => <span className="text-lg font-semibold text-brand-500">{row.value}</span> },
    { header: "Status", cell: (row) => <Badge tone={row.status === "healthy" ? "good" : row.status === "warning" ? "warning" : "critical"}>{row.status}</Badge> },
  ];

  return (
    <div>
      <PageHeader
        title="System Settings & Administration"
        description="Monitor system health, manage configuration, and view system-wide analytics."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Pumps" value={PUMPS.length.toString()} icon={<TankIcon size={19} />} accent="var(--brand-500)" />
        <KpiCard label="Active Users" value="24" icon={<ShieldCheckIcon size={19} />} accent="var(--series-2)" />
        <KpiCard label="System Uptime" value="99.8%" icon={<ClockIcon size={19} />} accent="var(--series-6)" />
        <KpiCard label="Response Time" value="245ms" icon={<SettingsIcon size={19} />} accent="var(--series-4)" />
      </div>

      <Card className="mb-6">
        <CardHeader title="System Health" subtitle="Real-time system metrics and performance indicators" />
        <Table columns={columns} rows={systemMetrics} rowKey={(row) => row.name} />
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="System Configuration" subtitle="Core system settings and configuration" />
          <div className="space-y-4 p-6">
            <div className="flex items-center justify-between py-3 border-b border-border-subtle">
              <div>
                <p className="font-medium text-ink-primary">Database Version</p>
                <p className="text-xs text-ink-muted">v2.1.0</p>
              </div>
              <Badge tone="good">v2.1.0</Badge>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border-subtle">
              <div>
                <p className="font-medium text-ink-primary">API Version</p>
                <p className="text-xs text-ink-muted">v3.2.1</p>
              </div>
              <Badge tone="good">v3.2.1</Badge>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-ink-primary">Backup Status</p>
                <p className="text-xs text-ink-muted">Last backup 2 hours ago</p>
              </div>
              <Badge tone="good">Automated</Badge>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Security Settings" subtitle="System security and access control" />
          <div className="space-y-4 p-6">
            <div className="flex items-center justify-between py-3 border-b border-border-subtle">
              <div>
                <p className="font-medium text-ink-primary">Two-Factor Authentication</p>
                <p className="text-xs text-ink-muted">Optional for all users</p>
              </div>
              <Badge tone="warning">Optional</Badge>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border-subtle">
              <div>
                <p className="font-medium text-ink-primary">Session Timeout</p>
                <p className="text-xs text-ink-muted">30 minutes of inactivity</p>
              </div>
              <Badge tone="neutral">30 min</Badge>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-ink-primary">SSL Certificate</p>
                <p className="text-xs text-ink-muted">Expires in 125 days</p>
              </div>
              <Badge tone="good">Valid</Badge>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Audit Log" subtitle="Recent system activity and administrative actions" />
        <div className="overflow-x-auto p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border-subtle">
              <div>
                <p className="text-sm font-medium text-ink-primary">Admin Dashboard Accessed</p>
                <p className="text-xs text-ink-muted">{session.adminName} • 2 hours ago</p>
              </div>
              <Badge tone="neutral">Access</Badge>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border-subtle">
              <div>
                <p className="text-sm font-medium text-ink-primary">Pump Configuration Updated</p>
                <p className="text-xs text-ink-muted">PUMP-021 • 5 hours ago</p>
              </div>
              <Badge tone="warning">Update</Badge>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-ink-primary">System Backup Completed</p>
                <p className="text-xs text-ink-muted">Automated • 8 hours ago</p>
              </div>
              <Badge tone="good">Success</Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
