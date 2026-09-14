import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, type Column } from "@/components/ui/Table";
import { VehicleForm } from "@/components/security-guard/VehicleForm";
import { getSecurityGuardSession } from "@/lib/security-guard/session";
import { getVehiclesToday } from "@/lib/security-guard/activity-store";
import { logVehicleExitAction } from "@/lib/security-guard/actions";
import { simulateLatency } from "@/lib/utils";
import { formatTime, titleCase } from "@/lib/format";
import type { VehicleLogEntry } from "@/lib/security-guard/types";

export default async function VehicleLogPage() {
  await simulateLatency();
  const session = await getSecurityGuardSession();
  const vehicles = getVehiclesToday(session.guardId);

  const columns: Column<VehicleLogEntry>[] = [
    { header: "Reg. number", cell: (row) => <span className="font-medium">{row.regNumber}</span> },
    { header: "Type", cell: (row) => titleCase(row.vehicleType) },
    { header: "Driver", cell: (row) => row.driverName || "—" },
    { header: "Purpose", cell: (row) => <span className="text-ink-muted">{row.purpose || "—"}</span> },
    { header: "Entered", cell: (row) => formatTime(row.enteredAt) },
    {
      header: "Exited",
      cell: (row) =>
        row.exitedAt ? (
          formatTime(row.exitedAt)
        ) : (
          <form action={logVehicleExitAction}>
            <input type="hidden" name="vehicleId" value={row.id} />
            <button type="submit" className="text-xs font-medium text-brand-500 hover:underline">
              Log exit
            </button>
          </form>
        ),
    },
    {
      header: "Status",
      cell: (row) => <Badge tone={row.exitedAt ? "neutral" : "good"}>{row.exitedAt ? "Exited" : "On site"}</Badge>,
    },
  ];

  return (
    <div>
      <PageHeader title="Vehicle Entry/Exit Log" description="Log every vehicle entering or leaving your assigned pump." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Log a vehicle entry" />
          <VehicleForm />
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Today's vehicles" subtitle={`${vehicles.length} vehicle(s) logged today`} />
          <Table columns={columns} rows={vehicles} rowKey={(row) => row.id} emptyMessage="No vehicles logged yet today." />
        </Card>
      </div>
    </div>
  );
}
