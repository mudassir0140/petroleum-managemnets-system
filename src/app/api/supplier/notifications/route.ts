import { getSupplierAccount } from "@/lib/supplier/session";
import { listSupplierNotifications } from "@/lib/supplier/notifications";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// The signed-in supplier's fuel-request notifications and their unread count.
export async function GET() {
  try {
    const account = await getSupplierAccount();
    if (!account) return jsonError(401, "Unauthorized");
    return jsonNoStore(await listSupplierNotifications(account._id));
  } catch (error) {
    console.error("[SupplierNotifications] list error:", error);
    return jsonError(500, "Failed to load notifications");
  }
}
