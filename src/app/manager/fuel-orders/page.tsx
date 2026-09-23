import { PageHeader } from "@/components/ops/page-header";
import { SectionCard } from "@/components/ops/section-card";
import { ManagerFuelOrdersClient } from "./client";
import { getOrdersByPump } from "@/lib/db/order-service";
import { getAllPumps } from "@/lib/db/pump-service";
import { initializeTrucks } from "@/lib/db/truck-service";

export const dynamic = "force-dynamic";

interface FuelOrder {
  _id: string;
  pumpId: string;
  pumpName: string;
  fuelType: "petrol" | "diesel";
  quantityLitres: number;
  status: string;
  requestedAt: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  driverName?: string;
  trackingNumber?: string;
  expectedArrival?: string;
  driverConfirmedAt?: string;
  pumpOwnerConfirmedAt?: string;
}

export default async function ManagerFuelOrdersPage() {
  await initializeTrucks();

  const pumps = await getAllPumps();
  const allOrders: FuelOrder[] = [];

  for (const pump of pumps) {
    const orders = await getOrdersByPump(pump._id!.toString());
    allOrders.push(
      ...orders.map((o) => ({
        _id: o._id?.toString() || "",
        pumpId: o.pumpId.toString(),
        pumpName: o.pumpName,
        fuelType: o.fuelType,
        quantityLitres: o.quantityLitres,
        status: o.status,
        requestedAt: o.requestedAt.toISOString(),
        dispatchedAt: o.dispatchedAt?.toISOString(),
        deliveredAt: o.deliveredAt?.toISOString(),
        driverName: o.driverName,
        trackingNumber: o.trackingNumber,
        expectedArrival: o.expectedArrival?.toISOString(),
        driverConfirmedAt: o.driverConfirmedAt?.toISOString(),
        pumpOwnerConfirmedAt: o.pumpOwnerConfirmedAt?.toISOString(),
      }))
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fuel Order Management"
        description="Review and dispatch fuel orders from pump owners"
      />

      <SectionCard
        title="Active Orders"
        description="Orders from all pumps — review and mark as 'On The Way' once dispatched"
      >
        <div className="p-6">
          <ManagerFuelOrdersClient initialOrders={allOrders} />
        </div>
      </SectionCard>
    </div>
  );
}
