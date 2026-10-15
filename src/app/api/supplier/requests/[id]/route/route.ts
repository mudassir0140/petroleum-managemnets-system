import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getSupplierAccount } from "@/lib/supplier/session";
import { getSupplierRequestRoute } from "@/lib/supplier/service";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OBJECT_ID = /^[a-f0-9]{24}$/i;

// The delivery route for one of the supplier's requests. route is null when a location is missing,
// so the UI shows "Route unavailable" instead of an estimate.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const account = await getSupplierAccount();
    if (!account) return jsonError(401, "Unauthorized");

    const id = (await params).id;
    if (!OBJECT_ID.test(id)) return jsonError(404, "Request not found");

    const result = await getSupplierRequestRoute(account._id, new ObjectId(id));
    if (!result.ok) return jsonError(result.status, result.error);
    return jsonNoStore(result.data);
  } catch (error) {
    console.error("[SupplierRequests] route error:", error);
    return jsonError(500, "Failed to load the route");
  }
}
