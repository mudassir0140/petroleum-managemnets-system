import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { FuelOrderForm } from "@/components/pump-owner/FuelOrderForm";
import { FuelOrdersList } from "@/components/pump-owner/FuelOrdersList";
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
  await simulateLatency();
  const session = await getSession();
  const orders = await getOrdersByPump(session.pumpId);

  const displayOrders = orders.map((o) => ({
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
  }));

  return (
    <div>
      <PageHeader title="Fuel Orders" description="Request fuel and track deliveries" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <FuelOrderForm pumpId={session.pumpId} onSuccess={() => window.location.reload()} />
        </div>

        <div className="lg:col-span-2">
          <FuelOrdersList orders={displayOrders} onRefresh={() => window.location.reload()} />
        </div>
      </div>
    </div>
  );
}
