import { withIdempotency } from "@/lib/offline/with-idempotency";
import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { khataOwner } from "@/lib/khata/api-session";
import { KHATA_NO_STORE_HEADERS } from "@/lib/khata/no-store";
import { createTransaction } from "@/lib/khata/transactions";
import { isPaymentMethod, PAYMENT_METHODS, type PaymentMethod } from "@/lib/khata/payments";
import { todayPakistan } from "@/lib/khata/monthly";
import { monthKeyOf, type PaymentAllocation } from "@/lib/khata/ledger";

// Payments feed the live owner and client khata views, so never cache them.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const METHOD_FIELDS = ["chequeNumber", "chequeDate", "bankName", "bankAccount", "transactionId", "walletProvider"] as const;

export async function GET(request: NextRequest) {
  try {
    const owner = await khataOwner();
    if (!owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const khataClientId = new URL(request.url).searchParams.get("khataClientId");
    const db = await getDatabase();
    const query: Record<string, unknown> = { pumpId: new ObjectId(owner.pumpId) };
    if (khataClientId && ObjectId.isValid(khataClientId)) query.khataClientId = new ObjectId(khataClientId);

    const payments = await db.collection("khataPayments").find(query).sort({ date: -1 }).toArray();

    return NextResponse.json(
      payments.map((payment) => ({
        _id: String(payment._id),
        txnId: payment.txnId ?? "",
        khataClientId: String(payment.khataClientId),
        amountReceived: payment.amountReceived ?? 0,
        advancePaid: payment.advancePaid ?? 0,
        method: payment.method ?? "",
        status: payment.status ?? "confirmed",
        source: payment.source ?? "owner",
        details: payment.details ?? {},
        date: payment.date,
        khataMonth: monthKeyOf(typeof payment.date === "string" ? payment.date : new Date(payment.date)),
        note: payment.note ?? "",
        recordedBy: payment.recordedBy ?? "",
        verifiedBy: payment.verifiedBy ?? "",
        attachmentId: payment.attachmentId ? String(payment.attachmentId) : "",
        allocations: Array.isArray(payment.allocations) ? payment.allocations : null,
        unallocated: payment.unallocated ?? null,
        createdAt: payment.createdAt,
      })),
      { headers: KHATA_NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error("[Khata Payments] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch khata payments" }, { status: 500 });
  }
}

// The owner records a payment. Cash is received at once; a cheque waits to clear; a bank transfer or wallet
// payment is confirmed when verified (or at entry, if the owner verifies it there).
export const POST = withIdempotency(postHandler);

async function postHandler(request: NextRequest) {
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
      return NextResponse.json({ error: "Choose a payment method: cash, cheque, bank transfer or mobile wallet" }, { status: 400 });
    }

    const now = new Date();
    const details: Record<string, unknown> = {};
    for (const key of METHOD_FIELDS) {
      if (typeof body?.[key] === "string") details[key] = body[key];
    }
    const allocations: PaymentAllocation[] = Array.isArray(body?.allocations)
      ? body.allocations.map((a: { month?: unknown; amount?: unknown }) => ({ month: String(a?.month ?? ""), amount: parseFloat(String(a?.amount ?? 0)) || 0 }))
      : [];

    const result = await createTransaction(
      new ObjectId(owner.pumpId),
      new ObjectId(khataClientId),
      {
        method: method as PaymentMethod,
        amountReceived: parseFloat(body?.amountReceived ?? 0) || 0,
        advancePaid: parseFloat(body?.advancePaid ?? 0) || 0,
        date: typeof body?.date === "string" && body.date ? body.date : todayPakistan(now),
        note: typeof body?.note === "string" ? body.note.trim() : "",
        details: { ...details, amount: parseFloat(body?.amountReceived ?? 0) || 0 },
        allocationMode: body?.allocationMode === "month" ? "month" : "oldest-first",
        allocations,
      },
      { source: "owner", actor: owner.name, ownerVerified: body?.verifyNow === true },
      now
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error, code: result.code }, { status: result.status });
    }
    return NextResponse.json({
      success: true,
      paymentId: result.paymentId,
      txnId: result.txnId,
      status: result.status,
      allocations: result.allocations,
      unallocated: result.unallocated,
      methods: PAYMENT_METHODS,
    });
  } catch (error) {
    console.error("[Khata Payments] POST error:", error);
    return NextResponse.json({ error: "Failed to record the payment" }, { status: 500 });
  }
}
