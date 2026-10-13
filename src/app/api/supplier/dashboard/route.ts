import { NextResponse } from "next/server";
import { KHATA_NO_STORE_HEADERS } from "@/lib/khata/no-store";
import { getSupplierAccount } from "@/lib/supplier/session";
import { getSupplierDashboard } from "@/lib/supplier/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const account = await getSupplierAccount();
    if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await getSupplierDashboard(account);
    return NextResponse.json(data, { headers: KHATA_NO_STORE_HEADERS });
  } catch (error) {
    console.error("[SupplierDashboard] GET error:", error);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
