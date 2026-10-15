import { ObjectId } from "mongodb";
import { PageHeader } from "@/components/ui/PageHeader";
import { TruckManagement } from "@/components/pump-owner/truck/TruckManagement";
import { getSession } from "@/lib/session";
import { listTrucksForPump } from "@/lib/truck/service";
import { getPumpById } from "@/lib/db/pump-service";
import { formatLocation } from "@/lib/location/fields";
import { listIncomingForPump } from "@/lib/truck/delivery";
import { IncomingDeliveries } from "@/components/pump-owner/truck/IncomingDeliveries";
import { FuelDeliveries } from "@/components/pump-owner/truck/FuelDeliveries";
import { listFuelDeliveriesForPump } from "@/lib/supplier/fuel-deliveries";
import { nowMs, simulateLatency } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Trucks owned by the logged-in pump, read from MongoDB. Nothing here is demo data.
export default async function TankersPage() {
  await simulateLatency();
  const session = await getSession();
  const trucks = await listTrucksForPump(new ObjectId(session.pumpId));
  const pump = await getPumpById(session.pumpId);
  const pumpLocation = pump ? formatLocation({ ...pump }) : "";
  const incoming = await listIncomingForPump(new ObjectId(session.pumpId));
  const deliveries = await listFuelDeliveriesForPump(new ObjectId(session.pumpId));

  return (
    <div>
      <PageHeader title="Incoming Tanker" description="Your trucks, their drivers, routes and live status." />
      <p className="mb-4 text-sm text-slate-700 dark:text-slate-300">Pump location / پمپ کا مقام: {pumpLocation || "Not saved / محفوظ نہیں"}</p>
      <TruckManagement initialTrucks={trucks} serverNow={nowMs()} />
      <div className="mt-6">
        <IncomingDeliveries items={incoming} />
      </div>
      <div className="mt-6">
        <FuelDeliveries items={deliveries} />
      </div>
    </div>
  );
}
