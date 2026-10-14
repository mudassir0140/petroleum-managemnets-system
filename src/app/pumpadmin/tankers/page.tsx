import { ObjectId } from "mongodb";
import { PageHeader } from "@/components/ui/PageHeader";
import { TruckManagement } from "@/components/pump-owner/truck/TruckManagement";
import { getSession } from "@/lib/session";
import { listTrucksForPump } from "@/lib/truck/service";
import { nowMs, simulateLatency } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Trucks owned by the logged-in pump, read from MongoDB. Nothing here is demo data.
export default async function TankersPage() {
  await simulateLatency();
  const session = await getSession();
  const trucks = await listTrucksForPump(new ObjectId(session.pumpId));

  return (
    <div>
      <PageHeader title="Incoming Tanker" description="Your trucks, their drivers, routes and live status." />
      <TruckManagement initialTrucks={trucks} serverNow={nowMs()} />
    </div>
  );
}
