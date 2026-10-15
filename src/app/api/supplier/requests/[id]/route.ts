import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getSupplierAccount } from "@/lib/supplier/session";
import { applySupplierAction } from "@/lib/supplier/service";
import { confirmRequest, dispatchRequest } from "@/lib/supplier/fuel-deliveries";
import { isSupplierAction } from "@/lib/supplier/types";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// The supplier's steps on one of their own requests: Seen, Accept, Reject, Dispatch, Confirm, or Mark Delivered
// for older requests. Each step is checked on the server against the request's current status.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const account = await getSupplierAccount();
    if (!account) return jsonError(401, "Unauthorized");

    const id = (await params).id;
    if (!/^[a-f0-9]{24}$/i.test(id)) return jsonError(404, "Request not found");

    const body = await request.json().catch(() => null);
    const action = body?.action;
    if (!isSupplierAction(action)) return jsonError(400, "Unknown action");

    const requestId = new ObjectId(id);
    if (action === "dispatch") {
      const result = await dispatchRequest(account._id, requestId);
      if (!result.ok) return jsonError(result.status, result.error);
      return jsonNoStore(result.data);
    }
    if (action === "confirm") {
      const result = await confirmRequest("supplier", requestId, { supplierId: account._id });
      if (!result.ok) return jsonError(result.status, result.error);
      return jsonNoStore(result.data);
    }

    // The service matches the request on supplierId, so another supplier's ids fail.
    const result = await applySupplierAction(account._id, requestId, action, { ratePerLitre: body?.ratePerLitre });
    if (!result.ok) return jsonError(result.status, result.error);
    return jsonNoStore(result.data);
  } catch (error) {
    console.error("[SupplierRequests] action error:", error);
    return jsonError(500, "Failed to update the request");
  }
}
