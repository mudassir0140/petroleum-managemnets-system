import { NextResponse } from "next/server";
import { getSupplierAccount } from "@/lib/supplier/session";
import { markSupplierNotificationsRead } from "@/lib/supplier/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST() {
  try {
    const account = await getSupplierAccount();
    if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await markSupplierNotificationsRead(account._id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SupplierNotifications] read error:", error);
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}
