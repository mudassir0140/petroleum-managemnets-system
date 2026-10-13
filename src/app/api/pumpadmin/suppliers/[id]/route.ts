import { NextRequest, NextResponse } from "next/server";
import { toObjectId } from "@/lib/khata/ids";
import { KHATA_NO_STORE_HEADERS } from "@/lib/khata/no-store";
import { getPumpAdminSessionOrNull } from "@/lib/supplier/session";
import { getSupplierDetail } from "@/lib/supplier/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getPumpAdminSessionOrNull();
    const pumpId = toObjectId(session?.pumpId);
    if (!pumpId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supplierId = toObjectId((await params).id);
    if (!supplierId) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });

    const detail = await getSupplierDetail(pumpId, supplierId);
    if (!detail) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    return NextResponse.json(detail, { headers: KHATA_NO_STORE_HEADERS });
  } catch (error) {
    console.error("[Suppliers] GET detail error:", error);
    return NextResponse.json({ error: "Failed to load supplier" }, { status: 500 });
  }
}
