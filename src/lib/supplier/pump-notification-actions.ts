"use server";

import { toObjectId } from "@/lib/khata/ids";
import { getPumpAdminSessionOrNull } from "@/lib/supplier/session";
import { markPumpNotificationsRead } from "@/lib/supplier/service";
import { markAllNotificationsAsRead } from "@/lib/db/notification-service";

// Called when the pump admin opens the header bell: marks that pump's supplier updates
// and fuel order updates as read.
export async function markPumpAdminNotificationsRead(): Promise<void> {
  const session = await getPumpAdminSessionOrNull();
  const pumpId = toObjectId(session?.pumpId);
  if (!pumpId) return;
  await Promise.all([markPumpNotificationsRead(pumpId), markAllNotificationsAsRead(pumpId.toHexString(), "pump-owner")]);
}
