import { PageHeader } from "@/components/ui/PageHeader";
import { SupplierHub } from "@/components/pump-owner/supplier/SupplierHub";
import { simulateLatency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function FuelOrdersPage() {
  await simulateLatency();

  return (
    <div>
      <PageHeader title="Fuel Orders" description="Request fuel and track deliveries" />
      <SupplierHub />
    </div>
  );
}
