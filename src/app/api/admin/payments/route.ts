import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { createPayment, getAllPayments, markPaymentPaid } from "@/lib/db/payment-service";
import { getPumpById } from "@/lib/db/pump-service";

async function getAdminId(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("admin_session");
  if (!sessionCookie) return null;
  try {
    const session = JSON.parse(sessionCookie.value);
    if (typeof session.adminId !== "string" || !ObjectId.isValid(session.adminId)) return null;
    return session.adminId;
  } catch {
    return null;
  }
}

const UNAUTHORIZED = { error: "Unauthorized — please log in as Admin first (/admin/login)" };

export async function GET() {
  const adminId = await getAdminId();
  if (!adminId) return NextResponse.json(UNAUTHORIZED, { status: 401 });

  const payments = await getAllPayments();
  return NextResponse.json({
    success: true,
    payments: payments.map((p) => ({
      ...p,
      pumpId: p.pumpId.toString(),
      orderId: p.orderId?.toString(),
      createdBy: p.createdBy.toString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  try {
    const adminId = await getAdminId();
    if (!adminId) return NextResponse.json(UNAUTHORIZED, { status: 401 });

    const { pumpId, amountDue, dueDate, orderId, notes } = await request.json();

    if (!pumpId || !ObjectId.isValid(pumpId)) {
      return NextResponse.json({ error: "Missing or invalid pumpId" }, { status: 400 });
    }
    if (typeof amountDue !== "number" || amountDue <= 0) {
      return NextResponse.json({ error: "amountDue must be a positive number" }, { status: 400 });
    }
    if (!dueDate || Number.isNaN(new Date(dueDate).getTime())) {
      return NextResponse.json({ error: "Missing or invalid dueDate" }, { status: 400 });
    }
    if (orderId && !ObjectId.isValid(orderId)) {
      return NextResponse.json({ error: "Invalid orderId" }, { status: 400 });
    }

    const pump = await getPumpById(pumpId);
    if (!pump) {
      return NextResponse.json({ error: "Pump not found" }, { status: 404 });
    }

    const payment = await createPayment(
      {
        pumpId: new ObjectId(pumpId),
        pumpName: pump.name,
        orderId: orderId ? new ObjectId(orderId) : undefined,
        amountDue,
        dueDate: new Date(dueDate),
        notes: notes || undefined,
      },
      adminId
    );

    return NextResponse.json(
      { success: true, payment: { ...payment, pumpId: payment.pumpId.toString() } },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[PaymentsAPI] POST error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminId = await getAdminId();
    if (!adminId) return NextResponse.json(UNAUTHORIZED, { status: 401 });

    const { paymentId, amountPaid } = await request.json();
    if (!paymentId || !ObjectId.isValid(paymentId)) {
      return NextResponse.json({ error: "Missing or invalid paymentId" }, { status: 400 });
    }
    if (typeof amountPaid !== "number" || amountPaid < 0) {
      return NextResponse.json({ error: "amountPaid must be a non-negative number" }, { status: 400 });
    }

    const payment = await markPaymentPaid(paymentId, amountPaid);
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, payment: { ...payment, pumpId: payment.pumpId.toString() } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
