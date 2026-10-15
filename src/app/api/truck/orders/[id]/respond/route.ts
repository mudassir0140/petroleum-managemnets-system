import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getTruckAccount } from "@/lib/truck/session";
import { respondToTrip } from "@/lib/truck/service";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// The driver accepts or rejects a trip assigned to their truck.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const account = await getTruckAccount();
    if (!account) return jsonError(401, "Unauthorized");

    const id = (await params).id;
    if (!/^[a-f0-9]{24}$/i.test(id)) return jsonError(404, "Trip not found");

    const body = await request.json().catch(() => null);
    const action = body?.action;
    if (action !== "accept" && action !== "reject") return jsonError(400, "Action must be accept or reject");

    const result = await respondToTrip(account._id, new ObjectId(id), action);
    if (!result.ok) return jsonError(result.status, result.error);
    return jsonNoStore(result.data);
  } catch (error) {
    console.error("[TruckTrip] respond error:", error);
    return jsonError(500, "Failed to update the trip");
  }
}
