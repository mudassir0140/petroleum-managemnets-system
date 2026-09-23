import { PageHeader } from "@/components/ui/PageHeader";
import { FuelOrdersClient } from "@/components/pump-owner/FuelOrdersClient";
import { getSession } from "@/lib/session";
import { getOrdersByPump } from "@/lib/db/order-service";
import { simulateLatency } from "@/lib/utils";

interface FuelOrder {
  _id: string;
  pumpId: string;
  pumpName: string;
  fuelType: "petrol" | "diesel";
  quantityLitres: number;
  status: "pending" | "accepted" | "on-the-way" | "dispatched" | "delivered" | "completed" | "payment-pending" | "paid" | "cleared";
  requestedAt: string;
  acceptedAt?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  driverName?: string;
  trackingNumber?: string;
  expectedArrival?: string;
  driverConfirmedAt?: string;
  pumpOwnerConfirmedAt?: string;
  totalAmount?: number;
  notes?: string;
}

export const dynamic = "force-dynamic";

export default async function FuelOrdersPage() {
  try {
    await simulateLatency();
    const session = await getSession();
    console.log("[FuelOrdersPage] Session pumpId:", session.pumpId);

    const orders = await getOrdersByPump(session.pumpId);
    console.log("[FuelOrdersPage] Orders fetched:", orders.length);

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
        <FuelOrdersClient pumpId={session.pumpId} orders={displayOrders} />
      </div>
    );
  } catch (error) {
    console.error("[FuelOrdersPage] Fatal error:", error);
    throw error;
  }
}
