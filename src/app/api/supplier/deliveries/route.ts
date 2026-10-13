import { NextRequest, NextResponse } from "next/server";
import { toObjectId } from "@/lib/khata/ids";
import { getSupplierAccount } from "@/lib/supplier/session";
import { recordSupplierDelivery } from "@/lib/supplier/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Records litres delivered against an accepted request.
export async function POST(request: NextRequest) {
  try {
    const account = await getSupplierAccount();
    if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => null);
    const requestId = toObjectId(body?.requestId);
    const litres = parseFloat(String(body?.litres ?? ""));
    const ratePerLitre = parseFloat(String(body?.ratePerLitre ?? ""));
    const deliveredOn = typeof body?.deliveredOn === "string" && body.deliveredOn ? new Date(body.deliveredOn) : undefined;
    const note = typeof body?.note === "string" ? body.note.trim() : "";

    if (!requestId) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    if (!Number.isFinite(litres) || litres <= 0) {
      return NextResponse.json({ error: "Enter the litres delivered" }, { status: 400 });
    }
    if (!Number.isFinite(ratePerLitre) || ratePerLitre <= 0) {
      return NextResponse.json({ error: "Enter the rate per litre" }, { status: 400 });
    }
    if (deliveredOn && Number.isNaN(deliveredOn.getTime())) {
      return NextResponse.json({ error: "Invalid delivery date" }, { status: 400 });
    }

    const result = await recordSupplierDelivery(account, { requestId, litres, ratePerLitre, deliveredOn, note });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ success: true, ...result.data }, { status: 201 });
  } catch (error) {
    console.error("[SupplierDelivery] POST error:", error);
    return NextResponse.json({ error: "Failed to record delivery" }, { status: 500 });
  }
}
