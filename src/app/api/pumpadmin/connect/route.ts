import type { Document } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import { getOwnerPumpIdForApi } from "@/lib/supplier/session";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";
import { relationFor, type RequestStatus } from "@/lib/connect/rules";
import { REQUESTS } from "@/lib/connect/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// The Connect page's data for the signed-in pump: other pumps with their connection state, the requests waiting for
// this pump's answer, and this pump's suppliers (who can be chatted with directly).
export async function GET() {
  try {
    const pumpId = await getOwnerPumpIdForApi();
    if (!pumpId) return jsonError(401, "Unauthorized");
    const me = String(pumpId);
    const db = await getDatabase();

    const [pumps, requests, suppliers] = await Promise.all([
      db.collection("pumps").find({ _id: { $ne: pumpId } }, { projection: { name: 1, city: 1 } }).sort({ name: 1 }).toArray(),
      db.collection(REQUESTS).find({ $or: [{ senderId: pumpId }, { receiverId: pumpId }] }).toArray(),
      db.collection("supplierAccounts").find({ pumpId }, { projection: { name: 1, companyName: 1, username: 1, disabled: 1 } }).sort({ companyName: 1 }).toArray(),
    ]);

    // Each other pump's state comes from every request between the two, in either direction.
    const directory = pumps.map((p: Document) => {
      const peer = String(p._id);
      const between = requests.filter((r: Document) => [String(r.senderId), String(r.receiverId)].includes(peer));
      const statuses = between.map((r: Document) => r.status as RequestStatus);
      const iSentPending = between.some((r: Document) => String(r.senderId) === me && r.status === "pending");
      const theySentPending = between.some((r: Document) => String(r.senderId) === peer && r.status === "pending");
      return {
        _id: peer,
        name: String(p.name || "Unknown pump"),
        city: String(p.city || ""),
        relation: relationFor(iSentPending, theySentPending, statuses),
      };
    });

    const incoming = requests
      .filter((r: Document) => String(r.receiverId) === me && r.status === "pending")
      .map((r: Document) => ({ _id: String(r._id), pumpId: String(r.senderId), name: String(r.senderName || "Unknown pump"), createdAt: r.createdAt }));

    return jsonNoStore({
      pumps: directory,
      incoming,
      connected: directory.filter((p) => p.relation === "connected").map((p) => ({ _id: p._id, name: p.name })),
      suppliers: suppliers.map((s: Document) => ({
        _id: String(s._id),
        name: String(s.companyName || s.name || "Supplier"),
        username: String(s.username || ""),
        disabled: s.disabled === true,
      })),
    });
  } catch (error) {
    console.error("[Connect] overview error:", error);
    return jsonError(500, "Failed to load connections");
  }
}
