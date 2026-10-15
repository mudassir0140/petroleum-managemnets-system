import { NextResponse } from "next/server";
import { getOwnerPumpIdForApi } from "@/lib/supplier/session";
import { listOwnerNotifications } from "@/lib/supplier/notifications";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE = { "Cache-Control": "no-store" };

// The signed-in pump owner's notifications about supplier responses, with the unread count.
export async function GET() {
  try {
    const pumpId = await getOwnerPumpIdForApi();
    if (!pumpId) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
    return NextResponse.json(await listOwnerNotifications(pumpId), { headers: NO_STORE });
  } catch (error) {
    console.error("[OwnerNotifications] list error:", error);
    return NextResponse.json({ error: "Failed to load notifications" }, { status: 500, headers: NO_STORE });
  }
}
