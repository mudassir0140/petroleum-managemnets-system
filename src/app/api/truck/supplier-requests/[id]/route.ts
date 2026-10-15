import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getTruckAccount } from "@/lib/truck/session";
import { answerRequestAsDriver } from "@/lib/truck/supplier-requests";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OBJECT_ID = /^[a-f0-9]{24}$/i;

// The driver accepts or rejects a request for their own truck. The service matches the truck id too.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const account = await getTruckAccount();
    if (!account) return jsonError(401, "Unauthorized");

    const id = (await params).id;
    if (!OBJECT_ID.test(id)) return jsonError(404, "Request not found");

    const body = await request.json().catch(() => null);
    const action = body?.action;
    if (action !== "accept" && action !== "reject") return jsonError(400, "Unknown action");

    const result = await answerRequestAsDriver(account._id, new ObjectId(id), action);
    if (!result.ok) return jsonError(result.status, result.error);
    return jsonNoStore(result.data);
  } catch (error) {
    console.error("[DriverSupplierRequests] answer error:", error);
    return jsonError(500, "Failed to update the request");
  }
}
