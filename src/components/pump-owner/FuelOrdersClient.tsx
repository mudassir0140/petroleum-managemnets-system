"use client";

import { FuelOrderForm } from "./FuelOrderForm";
import { FuelOrdersList } from "./FuelOrdersList";
import { SupplierFuelRequestForm } from "./SupplierFuelRequestForm";
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
  pumpAdmin = false,
}: {
  pumpId: string;
  orders: FuelOrder[];
  suppliers?: SupplierListItem[];
  // Pump Admin page uses the supplier request form; the pump owner page keeps FuelOrderForm.
  pumpAdmin?: boolean;
}) {
  return (
    <div className="space-y-6">
      {pumpAdmin ? (
        <SupplierFuelRequestForm pumpId={pumpId} onSuccess={() => window.location.reload()} />
      ) : (
        <FuelOrderForm pumpId={pumpId} onSuccess={() => window.location.reload()} />
      )}

      {/* Pump admin sees supplier updates in the header bell, not on this page. */}
      <FuelOrdersList
        orders={orders}
        suppliers={suppliers}
        onRefresh={() => window.location.reload()}
        showSupplierUpdates={!pumpAdmin}
      />
    </div>
  );
}
