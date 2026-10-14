import { ObjectId } from "mongodb";
import { getOwnerPumpIdForApi } from "@/lib/supplier/session";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";
import { resetTruckPassword } from "@/lib/truck/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Sets a new driver password. The owner sees it once; the database keeps only a hash.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const pumpId = await getOwnerPumpIdForApi();
    if (!pumpId) return jsonError(401, "Unauthorized");

    const id = (await params).id;
    if (!/^[a-f0-9]{24}$/i.test(id)) return jsonError(404, "Truck not found");

    const result = await resetTruckPassword(pumpId, new ObjectId(id));
    if (!result.ok) return jsonError(result.status, result.error);
    return jsonNoStore({ success: true, ...result.data });
  } catch (error) {
    console.error("[Trucks] reset password error:", error);
    return jsonError(500, "Failed to reset the password");
  }
}
