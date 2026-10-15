import { PageHeader } from "@/components/ui/PageHeader";
import { FuelOrdersClient } from "@/components/pump-owner/FuelOrdersClient";
import { SupplierHub } from "@/components/pump-owner/supplier/SupplierHub";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { getSession } from "@/lib/session";
import { getOrdersByPump } from "@/lib/db/order-service";
import { getPumpOrderViews } from "@/lib/pump-owner/fuel-data";
import { simulateLatency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function FuelOrdersPage() {
  await simulateLatency();
  const session = await getSession();
  console.log("[FuelOrdersPage] Session pumpId:", session.pumpId);

  const orders = await getOrdersByPump(session.pumpId);
  console.log("[FuelOrdersPage] Orders fetched:", orders.length);

  // Order number and truck number for each row, from the same orders collection.
  const views = await getPumpOrderViews(session.pumpId);
  const viewById = new Map(views.map((v) => [v.id, v]));

  const displayOrders = orders.map((o) => {
    try {
      return {
        _id: o._id?.toString() || "",
        pumpId: o.pumpId.toString(),
        pumpName: o.pumpName,
        fuelType: o.fuelType,
        quantityLitres: o.quantityLitres,
        status: o.status,
        requestedAt: o.requestedAt.toISOString(),
        acceptedAt: o.acceptedAt?.toISOString(),
        dispatchedAt: o.dispatchedAt?.toISOString(),
        deliveredAt: o.deliveredAt?.toISOString(),
        driverName: o.driverName,
        trackingNumber: o.trackingNumber,
        expectedArrival: o.expectedArrival?.toISOString(),
        driverConfirmedAt: o.driverConfirmedAt?.toISOString(),
        pumpOwnerConfirmedAt: o.pumpOwnerConfirmedAt?.toISOString(),
        totalAmount: o.totalAmount,
        notes: o.notes,
        orderNumber: viewById.get(String(o._id))?.orderNumber ?? "",
        truckNumber: viewById.get(String(o._id))?.truckNumber ?? "",
      };
    } catch (mapError) {
      console.error("[FuelOrdersPage] Error mapping order:", o._id, mapError);
      throw mapError;
    }
  });

  console.log("[FuelOrdersPage] Display orders prepared:", displayOrders.length);

  return (
    <div>
      <PageHeader title="Fuel Orders" description="Request fuel and track deliveries" />
      <div className="mb-4 flex justify-end">
        <NotificationBell listUrl="/api/pumpadmin/notifications" readUrlBase="/api/pumpadmin/notifications" />
      </div>
      <SupplierHub />
      <FuelOrdersClient pumpId={session.pumpId} orders={displayOrders} />
    </div>
  );
}
