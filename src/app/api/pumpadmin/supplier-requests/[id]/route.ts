import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getOwnerPumpIdForApi } from "@/lib/supplier/session";
import { confirmRequest } from "@/lib/supplier/fuel-deliveries";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// The pump owner confirms that a delivery arrived. Only this pump's own requests can be confirmed.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const pumpId = await getOwnerPumpIdForApi();
    if (!pumpId) return jsonError(401, "Unauthorized");

    const id = (await params).id;
    if (!/^[a-f0-9]{24}$/i.test(id)) return jsonError(404, "Request not found");

    const body = await request.json().catch(() => null);
    if (body?.action !== "confirm") return jsonError(400, "Unknown action");

    const result = await confirmRequest("owner", new ObjectId(id), { pumpId });
    if (!result.ok) return jsonError(result.status, result.error);
    return jsonNoStore(result.data);
  } catch (error) {
    console.error("[SupplierRequests] owner confirm error:", error);
    return jsonError(500, "Failed to confirm the delivery");
  }
}
