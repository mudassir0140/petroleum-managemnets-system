import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getTruckAccount } from "@/lib/truck/session";
import { answerRequestAsDriver } from "@/lib/truck/supplier-requests";
import { arriveRequest } from "@/lib/supplier/fuel-deliveries";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OBJECT_ID = /^[a-f0-9]{24}$/i;

// The driver's steps on their own truck's request: accept or reject a new request, or report arrival
// when GPS is not available. The service matches the truck id, so another truck's requests fail.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const account = await getTruckAccount();
    if (!account) return jsonError(401, "Unauthorized");

    const id = (await params).id;
    if (!OBJECT_ID.test(id)) return jsonError(404, "Request not found");

    const body = await request.json().catch(() => null);
    const action = body?.action;
    if (action !== "accept" && action !== "reject" && action !== "arrive") return jsonError(400, "Unknown action");

    const result =
      action === "arrive"
        ? await arriveRequest(new ObjectId(id), "driver", account._id)
        : await answerRequestAsDriver(account._id, new ObjectId(id), action);
    if (!result.ok) return jsonError(result.status, result.error);
    return jsonNoStore(result.data);
  } catch (error) {
    console.error("[DriverSupplierRequests] answer error:", error);
    return jsonError(500, "Failed to update the request");
  }
}
