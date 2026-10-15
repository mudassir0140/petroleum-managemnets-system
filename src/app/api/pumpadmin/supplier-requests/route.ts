import { NextRequest, NextResponse } from "next/server";
import { toObjectId } from "@/lib/khata/ids";
import { getPumpAdminSessionOrNull } from "@/lib/supplier/session";
import { sendSupplierRequest } from "@/lib/supplier/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Pump Admin sends a fuel request to one supplier. The supplier is notified straight away.
export async function POST(request: NextRequest) {
  try {
    const session = await getPumpAdminSessionOrNull();
    const pumpId = toObjectId(session?.pumpId);
    if (!pumpId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => null);
    const supplierId = toObjectId(body?.supplierId);
    const litres = parseFloat(String(body?.litres ?? ""));
    const note = typeof body?.note === "string" ? body.note.trim() : "";
    const advanceRaw = body?.advanceAmount;
    const advanceAmount = advanceRaw === undefined || advanceRaw === null || advanceRaw === "" ? 0 : parseFloat(String(advanceRaw));
    const marketRate = parseFloat(String(body?.marketRate ?? ""));
    const offeredRate = parseFloat(String(body?.offeredRate ?? ""));
    const tankerDetail = typeof body?.tankerDetail === "string" ? body.tankerDetail.trim() : "";
    const fuelDateRaw = typeof body?.fuelDateTime === "string" ? body.fuelDateTime : "";
    const fuelDateTime = fuelDateRaw ? new Date(fuelDateRaw) : new Date();

    if (!supplierId) return NextResponse.json({ error: "Choose a supplier" }, { status: 400 });
    if (!Number.isFinite(litres) || litres <= 0) {
      return NextResponse.json({ error: "Enter a valid quantity" }, { status: 400 });
    }
    if (!Number.isFinite(marketRate) || marketRate <= 0) {
      return NextResponse.json({ error: "Enter a valid market rate (PKR)" }, { status: 400 });
    }
    if (!Number.isFinite(offeredRate) || offeredRate <= 0) {
      return NextResponse.json({ error: "Enter a valid offered rate (PKR)" }, { status: 400 });
    }
    if (!Number.isFinite(advanceAmount) || advanceAmount < 0) {
      return NextResponse.json({ error: "Advance amount must be 0 or more" }, { status: 400 });
    }
    if (Number.isNaN(fuelDateTime.getTime())) {
      return NextResponse.json({ error: "Enter a valid date and time" }, { status: 400 });
    }

    const result = await sendSupplierRequest(pumpId, {
      supplierId,
      litres,
      marketRate,
      offeredRate,
      advanceAmount,
      tankerDetail,
      fuelDateTime,
      note,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ success: true, ...result.data }, { status: 201 });
  } catch (error) {
    console.error("[SupplierRequests] POST error:", error);
    return NextResponse.json({ error: "Failed to send request" }, { status: 500 });
  }
}
