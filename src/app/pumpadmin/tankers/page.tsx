import { TankersClient } from "@/components/pumpadmin/TankersClient";
import { getSession } from "@/lib/session";
import { getPumpTankerBoard } from "@/lib/db/pump-tanker-service";

// Trucks, driver logins and fuel orders are live data, so read them on every request.
export const dynamic = "force-dynamic";

export default async function TankersPage() {
  const session = await getSession();
  const board = await getPumpTankerBoard(session.pumpId);
  return <TankersClient board={board} />;
}
