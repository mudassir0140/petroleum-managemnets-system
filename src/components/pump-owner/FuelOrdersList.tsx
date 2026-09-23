"use client";

import { Card, CardHeader } from "@/components/ui/Card";

interface FuelOrder {
  _id: string;
  pumpId: string;
  pumpName: string;
  fuelType: "petrol" | "diesel";
  quantityLitres: number;
  status: "pending" | "accepted" | "dispatched" | "delivered" | "payment-pending" | "paid" | "cleared";
  requestedAt: string;
  acceptedAt?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  driverName?: string;
  trackingNumber?: string;
  expectedArrival?: string;
  totalAmount?: number;
  notes?: string;
}

const STATUS_COLORS: Record<FuelOrder["status"], string> = {
  "pending": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  "accepted": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "dispatched": "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
  "delivered": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  "payment-pending": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  "paid": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "cleared": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
};

export function FuelOrdersList({ orders }: { orders: FuelOrder[] }) {
  return (
    <Card>
      <CardHeader title="Order History" subtitle="Track your fuel requests and deliveries" />
      <div className="overflow-x-auto">
        {orders.length === 0 ? (
          <div className="px-6 py-8 text-center text-slate-600 dark:text-slate-400">
            No fuel orders yet
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Fuel</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Quantity</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Driver</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Expected Arrival</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Requested</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {orders.map((o) => (
                <tr key={o._id}>
                  <td className="px-6 py-3 capitalize font-medium text-slate-900 dark:text-white">
                    {o.fuelType}
                  </td>
                  <td className="px-6 py-3 text-slate-600 dark:text-slate-400">
                    {o.quantityLitres.toLocaleString()} L
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[o.status]}`}>
                      {o.status.replace("-", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-600 dark:text-slate-400">
                    {o.driverName ? (
                      <div>
                        <p className="font-medium">{o.driverName}</p>
                        {o.trackingNumber && <p className="text-xs text-slate-500 dark:text-slate-500">{o.trackingNumber}</p>}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-6 py-3 text-slate-600 dark:text-slate-400">
                    {o.expectedArrival ? new Date(o.expectedArrival).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-6 py-3 text-slate-600 dark:text-slate-400">
                    {new Date(o.requestedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
}
