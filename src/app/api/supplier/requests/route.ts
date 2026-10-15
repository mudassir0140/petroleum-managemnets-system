import { getSupplierAccount } from "@/lib/supplier/session";
import { listRequestsForSupplier } from "@/lib/supplier/service";
import { attachSupplierNames } from "@/lib/supplier/fuel-deliveries";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// The signed-in supplier's own requests only.
export async function GET() {
  try {
    const account = await getSupplierAccount();
    if (!account) return jsonError(401, "Unauthorized");

    return jsonNoStore(await attachSupplierNames(await listRequestsForSupplier(account._id)));
  } catch (error) {
    console.error("[SupplierRequests] GET error:", error);
    return jsonError(500, "Failed to load requests");
  }
}
