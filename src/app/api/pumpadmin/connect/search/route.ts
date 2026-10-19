import { NextRequest } from "next/server";
import type { Document } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import { getOwnerPumpIdForApi } from "@/lib/supplier/session";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";
import { cleanSearch, escapeRegex, relationFor, type RequestStatus } from "@/lib/connect/rules";
import { REQUESTS } from "@/lib/connect/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Suggestions for the Connect search: other pumps whose name or company name contains the text, each with its
// connection state. The text is matched literally, and at most 8 suggestions are returned.
export async function GET(request: NextRequest) {
  try {
    const pumpId = await getOwnerPumpIdForApi();
    if (!pumpId) return jsonError(401, "Unauthorized");
    const text = cleanSearch(request.nextUrl.searchParams.get("q"));
    if (!text) return jsonNoStore({ suggestions: [] });

    const db = await getDatabase();
    const pattern = new RegExp(escapeRegex(text), "i");
    const pumps = await db
      .collection("pumps")
      .find({ _id: { $ne: pumpId }, $or: [{ name: pattern }, { companyName: pattern }] }, { projection: { name: 1, companyName: 1, city: 1 } })
      .sort({ name: 1 })
      .limit(8)
      .toArray();

    const ids = pumps.map((p: Document) => p._id);
    const requests = ids.length
      ? await db
          .collection(REQUESTS)
          .find({ $or: [{ senderId: pumpId, receiverId: { $in: ids } }, { senderId: { $in: ids }, receiverId: pumpId }] })
          .toArray()
      : [];

    const me = String(pumpId);
    return jsonNoStore({
      suggestions: pumps.map((p: Document) => {
        const peer = String(p._id);
        const between = requests.filter((r: Document) => [String(r.senderId), String(r.receiverId)].includes(peer));
        return {
          _id: peer,
          name: String(p.name || "Unknown pump"),
          companyName: String(p.companyName || ""),
          city: String(p.city || ""),
          relation: relationFor(
            between.some((r: Document) => String(r.senderId) === me && r.status === "pending"),
            between.some((r: Document) => String(r.senderId) === peer && r.status === "pending"),
            between.map((r: Document) => r.status as RequestStatus)
          ),
        };
      }),
    });
  } catch (error) {
    console.error("[Connect] search error:", error);
    return jsonError(500, "Search failed");
  }
}
