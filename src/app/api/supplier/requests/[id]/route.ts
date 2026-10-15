import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getSupplierAccount } from "@/lib/supplier/session";
import { applySupplierAction } from "@/lib/supplier/service";
import { isSupplierAction } from "@/lib/supplier/types";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Seen, Accept (with the rate per litre), Reject or Mark Delivered on one of the supplier's own requests.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const account = await getSupplierAccount();
    if (!account) return jsonError(401, "Unauthorized");

    const id = (await params).id;
    if (!/^[a-f0-9]{24}$/i.test(id)) return jsonError(404, "Request not found");

    const body = await request.json().catch(() => null);
    const action = body?.action;
    if (!isSupplierAction(action)) return jsonError(400, "Unknown action");

    // The request must belong to this supplier; applySupplierAction matches on supplierId too.
    const result = await applySupplierAction(account._id, new ObjectId(id), action, { ratePerLitre: body?.ratePerLitre });
    if (!result.ok) return jsonError(result.status, result.error);
    return jsonNoStore(result.data);
  } catch (error) {
    console.error("[SupplierRequests] action error:", error);
    return jsonError(500, "Failed to update the request");
  }
}
