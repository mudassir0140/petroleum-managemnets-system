"use client";

import { Card, CardHeader } from "@/components/ui/Card";
import { FuelOrderForm } from "./FuelOrderForm";
import { FuelOrdersList } from "./FuelOrdersList";

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

export function FuelOrdersClient({ pumpId, orders }: { pumpId: string; orders: FuelOrder[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <FuelOrderForm pumpId={pumpId} onSuccess={() => window.location.reload()} />
      </div>

      <div className="lg:col-span-2">
        <FuelOrdersList orders={orders} onRefresh={() => window.location.reload()} />
      </div>
    </div>
  );
}
