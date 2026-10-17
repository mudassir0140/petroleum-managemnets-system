import { NextRequest, NextResponse } from "next/server";
import { khataOwner } from "@/lib/khata/api-session";
import { ObjectId } from "mongodb";
import { editPayment, isDateOnly } from "@/lib/khata/monthly";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/khata/payments";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Edits one payment with an audit entry for every changed field. A payment in a closed month needs
// `confirmed: true`, and a reason is required for every edit.
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const owner = await khataOwner();
    if (!owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = (await params).id;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
    if (!reason) {
      return NextResponse.json({ error: "Give a reason for this change" }, { status: 400 });
    }

    const changes: Partial<{ amountReceived: number; advancePaid: number; method: PaymentMethod; date: string; note: string }> = {};
    if (body?.amountReceived !== undefined) changes.amountReceived = parseFloat(body.amountReceived) || 0;
    if (body?.advancePaid !== undefined) changes.advancePaid = parseFloat(body.advancePaid) || 0;
    if (body?.method !== undefined) {
      if (!(PAYMENT_METHODS as readonly string[]).includes(body.method)) {
        return NextResponse.json({ error: "Choose a payment method" }, { status: 400 });
      }
      changes.method = body.method;
    }
    if (body?.date !== undefined) {
      if (!isDateOnly(body.date)) return NextResponse.json({ error: "Enter a valid payment date" }, { status: 400 });
      changes.date = body.date;
    }
    if (body?.note !== undefined) changes.note = String(body.note ?? "").trim();

    const result = await editPayment(
      new ObjectId(owner.pumpId),
      new ObjectId(id),
      changes,
      { confirmed: body?.confirmed === true, editedBy: owner.name, reason },
      new Date()
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error, code: result.code }, { status: result.status });
    }
    return NextResponse.json({ success: true, changedFields: result.changedFields });
  } catch (error) {
    console.error("[Khata Payments] PUT error:", error);
    return NextResponse.json({ error: "Failed to save the change" }, { status: 500 });
  }
}
