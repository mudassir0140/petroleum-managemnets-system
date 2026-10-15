import Link from "next/link";
import { notFound } from "next/navigation";
import { ObjectId } from "mongodb";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { getSession } from "@/lib/session";
import { getTruckForPump, listOrdersForTruck } from "@/lib/truck/service";
import { routeForTruck } from "@/lib/truck/route";
import { TRUCK_TYPE_LABELS } from "@/lib/truck/types";
import { RouteSvg } from "@/components/pump-owner/truck/RouteSvg";
import { CancelOrderButton } from "@/components/pump-owner/truck/CancelOrderButton";
import { TruckMapPanel } from "@/components/pump-owner/truck/TruckMapPanel";

export const dynamic = "force-dynamic";

function formatDate(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

// One truck of the logged-in pump: details, username, orders, route and Free/Busy status.
// A truck that belongs to another pump gets the not-found page.
export default async function TruckDetailPage({ params }: { params: Promise<{ truckId: string }> }) {
  const { truckId } = await params;
  if (!/^[a-f0-9]{24}$/i.test(truckId)) notFound();

  const session = await getSession();
  const pumpId = new ObjectId(session.pumpId);
  const id = new ObjectId(truckId);

  const truck = await getTruckForPump(pumpId, id);
  if (!truck) notFound();

  const [orders, route] = await Promise.all([listOrdersForTruck(pumpId, id), routeForTruck(id)]);

  return (
    <div>
      <Link href="/pumpadmin/tankers" className="mb-4 inline-flex text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
        ← Back to trucks / واپس
      </Link>
      <PageHeader title={truck.truckNumber || "Truck"} description={`Driver: ${truck.driverName || "—"}`} />

      <div className="mb-4 flex flex-wrap gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${truck.availability === "free" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : truck.currentTrip ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"}`}>
          {truck.availability === "free" ? "Free / خالی" : truck.currentTrip ? "On the way / راستے میں" : "Busy / مصروف"}
        </span>
        {truck.truckType && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {TRUCK_TYPE_LABELS[truck.truckType].en} / {TRUCK_TYPE_LABELS[truck.truckType].ur}
          </span>
        )}
      </div>

      <Card className="mb-4">
        <CardHeader title="Truck details / ٹرک کی تفصیل" />
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-slate-500">Driver / ڈرائیور</dt>
            <dd className="font-medium text-slate-900 dark:text-white">{truck.driverName || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Phone / فون</dt>
            <dd className="font-medium text-slate-900 dark:text-white">{truck.phone || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Truck type / قسم</dt>
            <dd className="font-medium text-slate-900 dark:text-white">
              {truck.truckType ? `${TRUCK_TYPE_LABELS[truck.truckType].en} / ${TRUCK_TYPE_LABELS[truck.truckType].ur}` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Driver username / یوزر نیم</dt>
            <dd className="font-mono font-medium text-slate-900 dark:text-white">{truck.username || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Status / حالت</dt>
            <dd className="font-medium text-slate-900 dark:text-white">{truck.availability === "busy" ? "Busy / مصروف" : "Free / خالی"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Assigned pump / پمپ</dt>
            <dd className="font-medium text-slate-900 dark:text-white">{truck.pumpName || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Last location / آخری مقام</dt>
            <dd className="text-slate-900 dark:text-white">
              {truck.location ? `${truck.location.lat.toFixed(5)}, ${truck.location.lng.toFixed(5)} · ${formatDate(truck.location.at)}` : "Not shared yet / ابھی شیئر نہیں"}
            </dd>
          </div>
        </dl>
      </Card>

      <Card className="mb-4">
        <CardHeader title="Current route / موجودہ راستہ" />
        {truck.currentTrip ? (
          <div className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
            <p>
              {truck.currentTrip.pickupPump} → {truck.currentTrip.destinationPump}
            </p>
            {route ? (
              <div>
                <p>
                  {route.distanceKm} km · about {route.durationMin} min · Road / سڑک: {route.currentRoad ?? "—"}
                </p>
                <RouteSvg route={route} />
              </div>
            ) : (
              <p className="text-amber-700 dark:text-amber-400">Route unavailable: the pump coordinates or the routing service are missing. / راستہ دستیاب نہیں</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-400">No active trip / کوئی فعال سفر نہیں</p>
        )}
      </Card>

      <Card className="mb-4">
        <CardHeader title="Live map / لائیو نقشہ" subtitle="Start, destination and the driver's location. Updates every 10 seconds / ہر 10 سیکنڈ بعد تازہ" />
        <div className="p-5 pt-0">
          <TruckMapPanel truckId={truck.id} />
        </div>
      </Card>

      <Card>
        <CardHeader title="Orders / آرڈر" subtitle="Order history for this truck" />
        {orders.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">No orders yet / ابھی کوئی آرڈر نہیں</p>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {orders.map((o) => (
              <div key={o.orderId} className="space-y-1 py-3 text-sm">
                <p className="font-medium text-slate-900 dark:text-white">
                  {o.orderNumber} · {o.fuelType === "diesel" ? "Diesel / ڈیزل" : "Petrol / پیٹرول"} · {o.quantityLitres.toLocaleString()} L
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {o.pickupPump || "—"} → {o.destinationPump || "—"} · {o.status} · {formatDate(o.requestedAt)}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Driver response / جواب: {o.driverResponse} · Delivery confirmed by driver / ڈرائیور کی تصدیق: {o.driverConfirmed ? "yes" : "no"}
                </p>
                <CancelOrderButton orderId={o.orderId} status={o.status} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
