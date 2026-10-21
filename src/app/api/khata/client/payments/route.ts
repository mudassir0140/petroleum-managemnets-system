import { withIdempotency } from "@/lib/offline/with-idempotency";
import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { khataClientSession } from "@/lib/khata/client-session";
import { KHATA_NO_STORE_HEADERS } from "@/lib/khata/no-store";
import { createTransaction } from "@/lib/khata/transactions";
import { todayPakistan } from "@/lib/khata/monthly";
import { METHOD_LABELS, PAYMENT_METHODS, STATUS_LABELS, isPaymentMethod, isValidIdempotencyKey, type PaymentMethod } from "@/lib/khata/payments";
import { monthKeyOf, type PaymentAllocation } from "@/lib/khata/ledger";

// The client dashboard reads and sends payments here. Clients never confirm a payment: it stays pending
// until the pump owner verifies it, and it cannot touch another client's khata.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const METHOD_FIELDS = ["chequeNumber", "chequeDate", "bankName", "bankAccount", "transactionId", "walletProvider"] as const;

export async function GET() {
  try {
    const session = await khataClientSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await getDatabase();
    const payments = await db
      .collection("khataPayments")
      .find({ pumpId: session.pumpId, khataClientId: session.khataClientId })
      .sort({ date: -1, createdAt: -1 })
      .toArray();

    return NextResponse.json(
      {
        methods: PAYMENT_METHODS.map((m) => ({ value: m, label: METHOD_LABELS[m].en })),
        payments: payments.map((payment) => ({
          _id: String(payment._id),
          txnId: payment.txnId ?? "",
          method: payment.method ?? "",
          methodLabel: METHOD_LABELS[payment.method as PaymentMethod]?.en ?? "",
          status: payment.status ?? "confirmed",
          statusLabel: STATUS_LABELS[payment.status as keyof typeof STATUS_LABELS]?.en ?? "Confirmed",
          amountReceived: payment.amountReceived ?? 0,
          advancePaid: payment.advancePaid ?? 0,
          date: payment.date,
          khataMonth: monthKeyOf(typeof payment.date === "string" ? payment.date : new Date(payment.date)),
          note: payment.note ?? "",
          details: payment.details ?? {},
          attachmentId: payment.attachmentId ? String(payment.attachmentId) : "",
          createdAt: payment.createdAt,
        })),
      },
      { headers: KHATA_NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error("[Client Khata Payments] GET error:", error);
    return NextResponse.json({ error: "Failed to load payments" }, { status: 500 });
  }
}

// A client submits a payment with the same methods and fields as the owner. The submission is saved in the
// client's khata as pending and appears in the pump's notifications. Re-sending the same request key returns
// the saved record instead of recording it again.
export const POST = withIdempotency(postHandler);

async function postHandler(request: NextRequest) {
  try {
    const session = await khataClientSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => null);
    if (!isValidIdempotencyKey(body?.clientRequestId)) {
      return NextResponse.json({ error: "Missing or invalid request key" }, { status: 400 });
    }
    if (!isPaymentMethod(body?.method)) {
      return NextResponse.json({ error: "Choose a payment method: cash, cheque, bank transfer or mobile wallet" }, { status: 400 });
    }

    const now = new Date();
    const details: Record<string, unknown> = {};
    for (const key of METHOD_FIELDS) {
      if (typeof body?.[key] === "string") details[key] = body[key];
    }

    const result = await createTransaction(
      session.pumpId,
      session.khataClientId,
      {
        method: body.method,
        amountReceived: parseFloat(body?.amountReceived ?? 0) || 0,
        advancePaid: parseFloat(body?.advancePaid ?? 0) || 0,
        date: typeof body?.date === "string" && body.date ? body.date : todayPakistan(now),
        note: typeof body?.note === "string" ? body.note.trim().slice(0, 500) : "",
        details: { ...details, amount: parseFloat(body?.amountReceived ?? 0) || 0 },
        allocationMode: "oldest-first",
        allocations: [] as PaymentAllocation[],
      },
      { source: "client", actor: session.name || "client", ownerVerified: false, clientRequestId: body.clientRequestId },
      now
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error, code: result.code }, { status: result.status });
    }
    return NextResponse.json({
      success: true,
      duplicate: result.duplicate,
      paymentId: result.paymentId,
      txnId: result.txnId,
      status: result.status,
    });
  } catch (error) {
    console.error("[Client Khata Payments] POST error:", error);
    return NextResponse.json({ error: "Failed to submit the payment" }, { status: 500 });
  }
}
