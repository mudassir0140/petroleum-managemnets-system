import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getOwnerPumpIdForApi } from "@/lib/supplier/session";
import { markNotificationRead } from "@/lib/supplier/notifications";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE = { "Cache-Control": "no-store" };

// Marks one of this pump's supplier-response notifications as read.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const pumpId = await getOwnerPumpIdForApi();
    if (!pumpId) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });

    const id = (await params).id;
    if (!/^[a-f0-9]{24}$/i.test(id)) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404, headers: NO_STORE });
    }

    const found = await markNotificationRead("pump-owner", pumpId, new ObjectId(id));
    if (!found) return NextResponse.json({ error: "Notification not found" }, { status: 404, headers: NO_STORE });
    return NextResponse.json({ success: true }, { headers: NO_STORE });
  } catch (error) {
    console.error("[OwnerNotifications] read error:", error);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500, headers: NO_STORE });
  }
}
