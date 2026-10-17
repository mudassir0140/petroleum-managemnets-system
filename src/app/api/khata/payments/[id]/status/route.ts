import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { khataOwner } from "@/lib/khata/api-session";
import { setPaymentStatus } from "@/lib/khata/transactions";
import { STATUS_LABELS, type PaymentStatus } from "@/lib/khata/payments";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// The owner verifies or bounces a payment. Every change is recorded with who, when and why.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const owner = await khataOwner();
    if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = (await params).id;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

    const body = await request.json().catch(() => null);
    const to = body?.to;
    if (to !== "confirmed" && to !== "bounced" && to !== "pending") {
      return NextResponse.json({ error: "Choose confirmed, bounced or pending" }, { status: 400 });
    }
    const result = await setPaymentStatus(new ObjectId(owner.pumpId), new ObjectId(id), to as PaymentStatus, {
      actor: owner.name,
      reason: typeof body?.reason === "string" ? body.reason : "",
    }, new Date());
    if (!result.ok) return NextResponse.json({ error: result.error, code: result.code }, { status: result.status });
    return NextResponse.json({ success: true, status: result.status, label: STATUS_LABELS[result.status].en, allocations: result.allocations });
  } catch (error) {
    console.error("[Khata Payments] status error:", error);
    return NextResponse.json({ error: "Failed to change the status" }, { status: 500 });
  }
}
