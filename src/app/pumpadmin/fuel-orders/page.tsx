import { PageHeader } from "@/components/ui/PageHeader";
import { SupplierHub } from "@/components/pump-owner/supplier/SupplierHub";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { simulateLatency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function FuelOrdersPage() {
  await simulateLatency();

  return (
    <div>
      <PageHeader title="Fuel Orders" description="Request fuel and track deliveries" />
      <div className="mb-4 flex justify-end">
        <NotificationBell listUrl="/api/pumpadmin/notifications" readUrlBase="/api/pumpadmin/notifications" />
      </div>
      <SupplierHub />
    </div>
  );
}
