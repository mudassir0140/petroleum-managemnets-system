"use client";

import { FuelOrderForm } from "./FuelOrderForm";
import { FuelOrdersList } from "./FuelOrdersList";
import type { SupplierListItem } from "@/lib/supplier/types";

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

// The request form takes the full width; Order History sits below it.
export function FuelOrdersClient({
  pumpId,
  orders,
  suppliers = [],
}: {
  pumpId: string;
  orders: FuelOrder[];
  suppliers?: SupplierListItem[];
}) {
  return (
    <div className="space-y-6">
      <FuelOrderForm pumpId={pumpId} onSuccess={() => window.location.reload()} />

      <FuelOrdersList orders={orders} suppliers={suppliers} onRefresh={() => window.location.reload()} />
    </div>
  );
}
