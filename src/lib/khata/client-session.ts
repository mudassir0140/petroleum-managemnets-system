import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";

// The signed-in khata client, for the client's own payment routes. The client id is checked against the
// account in MongoDB, so a cookie for a deleted account or another pump gets nothing. Never redirects.
export async function khataClientSession(): Promise<{ khataClientId: ObjectId; pumpId: ObjectId; name: string } | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("khata_client_session")?.value;
  if (!raw) return null;

  let parsed: { khataClientId?: unknown; pumpId?: unknown };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed.khataClientId !== "string" || !ObjectId.isValid(parsed.khataClientId)) return null;
  if (typeof parsed.pumpId !== "string" || !ObjectId.isValid(parsed.pumpId)) return null;

  const db = await getDatabase();
  const client = await db.collection("khataClients").findOne(
    { _id: new ObjectId(parsed.khataClientId), pumpId: new ObjectId(parsed.pumpId) },
    { projection: { clientName: 1 } }
  );
  if (!client) return null;
  return { khataClientId: client._id as ObjectId, pumpId: new ObjectId(parsed.pumpId), name: String(client.clientName ?? "") };
}
