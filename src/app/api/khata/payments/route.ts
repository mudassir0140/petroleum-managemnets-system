import { NextRequest, NextResponse } from "next/server";
import { khataOwner } from "@/lib/khata/api-session";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { KHATA_NO_STORE_HEADERS } from "@/lib/khata/no-store";
import { PAYMENT_METHODS, recordPayment, todayPakistan, type PaymentMethod } from "@/lib/khata/monthly";
import type { PaymentAllocation } from "@/lib/khata/ledger";
import { monthKeyOf } from "@/lib/khata/ledger";

// Payments feed the live owner and client khata views, so never cache them.
export const dynamic = "force-dynamic";
export const revalidate = 0;

function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === "string" && (PAYMENT_METHODS as readonly string[]).includes(value);
}

export async function GET(request: NextRequest) {
  try {
    const owner = await khataOwner();
    if (!owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const khataClientId = searchParams.get("khataClientId");

    const db = await getDatabase();
    const query: Record<string, unknown> = { pumpId: new ObjectId(owner.pumpId) };
    if (khataClientId) {
      query.khataClientId = new ObjectId(khataClientId);
    }

    const payments = await db.collection("khataPayments").find(query).sort({ date: -1 }).toArray();

    return NextResponse.json(
      payments.map((payment) => ({
        _id: String(payment._id),
        khataClientId: String(payment.khataClientId),
        amountReceived: payment.amountReceived ?? 0,
        advancePaid: payment.advancePaid ?? 0,
        method: payment.method ?? "",
        allocationMode: payment.allocationMode ?? "",
        allocations: Array.isArray(payment.allocations) ? payment.allocations : null,
        unallocated: payment.unallocated ?? null,
        date: payment.date,
        khataMonth: monthKeyOf(typeof payment.date === "string" ? payment.date : new Date(payment.date)),
        note: payment.note ?? "",
        recordedBy: payment.recordedBy ?? "",
        createdAt: payment.createdAt,
      })),
      { headers: KHATA_NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error("[Khata Payments] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch khata payments" }, { status: 500 });
  }
}

// Records a payment or advance against an account, dated in an open month. Method and date default to
// cash and today, so older callers keep working. A closed month refuses the payment.
export async function POST(request: NextRequest) {
  try {
    const owner = await khataOwner();
    if (!owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const khataClientId = typeof body?.khataClientId === "string" ? body.khataClientId : "";
    if (!ObjectId.isValid(khataClientId)) {
      return NextResponse.json({ error: "Missing khata client ID" }, { status: 400 });
    }

    const method = body?.method ?? "cash";
    if (!isPaymentMethod(method)) {
      return NextResponse.json({ error: "Choose a payment method" }, { status: 400 });
    }

    const now = new Date();
    const amountReceived = parseFloat(body?.amountReceived ?? 0) || 0;
    const advancePaid = parseFloat(body?.advancePaid ?? 0) || 0;
    const date = typeof body?.date === "string" && body.date ? body.date : todayPakistan(now);
    const note = typeof body?.note === "string" ? body.note.trim() : "";
    // Oldest unpaid month first unless the owner allocates month by month.
    const allocationMode = body?.allocationMode === "month" ? "month" : "oldest-first";
    const allocations: PaymentAllocation[] = Array.isArray(body?.allocations)
      ? body.allocations.map((a: { month?: unknown; amount?: unknown }) => ({ month: String(a?.month ?? ""), amount: parseFloat(String(a?.amount ?? 0)) || 0 }))
      : [];

    const result = await recordPayment(
      new ObjectId(owner.pumpId),
      new ObjectId(khataClientId),
      { amountReceived, advancePaid, method, date, note, allocationMode, allocations },
      owner.name,
      now
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error, code: result.code }, { status: result.status });
    }
    return NextResponse.json({ success: true, paymentId: result.paymentId, month: result.month, monthRow: result.row ?? null, allocations: result.allocations, unallocated: result.unallocated });
  } catch (error) {
    console.error("[Khata Payments] POST error:", error);
    return NextResponse.json({ error: "Failed to record the payment" }, { status: 500 });
  }
}
