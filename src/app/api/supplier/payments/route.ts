import { NextRequest, NextResponse } from "next/server";
import { getSupplierAccount } from "@/lib/supplier/session";
import { recordSupplierPayment } from "@/lib/supplier/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Records a payment the supplier has received from the pump.
export async function POST(request: NextRequest) {
  try {
    const account = await getSupplierAccount();
    if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => null);
    const amount = parseFloat(String(body?.amount ?? ""));
    const paidOn = typeof body?.paidOn === "string" && body.paidOn ? new Date(body.paidOn) : undefined;
    const note = typeof body?.note === "string" ? body.note.trim() : "";

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Enter the amount received" }, { status: 400 });
    }
    if (paidOn && Number.isNaN(paidOn.getTime())) {
      return NextResponse.json({ error: "Invalid payment date" }, { status: 400 });
    }

    const result = await recordSupplierPayment(account, { amount, paidOn, note });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ success: true, ...result.data }, { status: 201 });
  } catch (error) {
    console.error("[SupplierPayment] POST error:", error);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}
