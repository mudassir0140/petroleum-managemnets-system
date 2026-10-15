import { ObjectId } from "mongodb";
import { getSupplierAccount } from "@/lib/supplier/session";
import { markNotificationRead } from "@/lib/supplier/notifications";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Marks one of the supplier's own notifications as read.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const account = await getSupplierAccount();
    if (!account) return jsonError(401, "Unauthorized");

    const id = (await params).id;
    if (!/^[a-f0-9]{24}$/i.test(id)) return jsonError(404, "Notification not found");

    const found = await markNotificationRead("supplier", account._id, new ObjectId(id));
    if (!found) return jsonError(404, "Notification not found");
    return jsonNoStore({ success: true });
  } catch (error) {
    console.error("[SupplierNotifications] read error:", error);
    return jsonError(500, "Failed to update notification");
  }
}
