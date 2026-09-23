import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { createPaymentProof, getPaymentProofsByPump, approvePaymentProof, rejectPaymentProof } from "@/lib/db/payment-proof-service";
import { updateOrderStatus } from "@/lib/db/order-service";

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

export async function POST(request: NextRequest) {
  try {
    const { orderId, invoiceId, pumpId, amountPaid, imageDataUrl } = await request.json();

    if (!orderId || !ObjectId.isValid(orderId)) {
      return NextResponse.json({ error: "Missing or invalid orderId" }, { status: 400 });
    }
    if (!invoiceId || !ObjectId.isValid(invoiceId)) {
      return NextResponse.json({ error: "Missing or invalid invoiceId" }, { status: 400 });
    }
    if (!pumpId || !ObjectId.isValid(pumpId)) {
      return NextResponse.json({ error: "Missing or invalid pumpId" }, { status: 400 });
    }
    if (typeof amountPaid !== "number" || amountPaid <= 0) {
      return NextResponse.json({ error: "Invalid amountPaid" }, { status: 400 });
    }
    if (!imageDataUrl) {
      return NextResponse.json({ error: "Missing payment proof image" }, { status: 400 });
    }

    const proof = await createPaymentProof({
      orderId: new ObjectId(orderId),
      invoiceId: new ObjectId(invoiceId),
      pumpId: new ObjectId(pumpId),
      amountPaid,
      imageDataUrl,
      uploadedAt: new Date(),
    });

    return NextResponse.json(
      { success: true, proof: { ...proof, orderId: proof.orderId.toString(), invoiceId: proof.invoiceId.toString(), pumpId: proof.pumpId.toString(), _id: proof._id?.toString() } },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[PaymentProofsAPI] POST error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const adminId = await getAdminId();
    if (!adminId) return NextResponse.json(UNAUTHORIZED, { status: 401 });

    const pumpId = new URL(request.url).searchParams.get("pumpId");
    if (!pumpId || !ObjectId.isValid(pumpId)) {
      return NextResponse.json({ error: "Missing or invalid pumpId" }, { status: 400 });
    }

    const proofs = await getPaymentProofsByPump(pumpId);
    return NextResponse.json({
      success: true,
      proofs: proofs.map((proof) => ({
        ...proof,
        orderId: proof.orderId.toString(),
        invoiceId: proof.invoiceId.toString(),
        pumpId: proof.pumpId.toString(),
        approvedBy: proof.approvedBy?.toString(),
        _id: proof._id?.toString(),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[PaymentProofsAPI] GET error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminId = await getAdminId();
    if (!adminId) return NextResponse.json(UNAUTHORIZED, { status: 401 });

    const { proofId, action, reason } = await request.json();

    if (!proofId || !ObjectId.isValid(proofId)) {
      return NextResponse.json({ error: "Missing or invalid proofId" }, { status: 400 });
    }
    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    if (action === "reject" && !reason) {
      return NextResponse.json({ error: "Rejection reason required" }, { status: 400 });
    }

    let proof;
    if (action === "approve") {
      proof = await approvePaymentProof(proofId, adminId);
      if (proof) {
        await updateOrderStatus(proof.orderId.toString(), "paid");
      }
    } else {
      proof = await rejectPaymentProof(proofId, adminId, reason);
    }

    if (!proof) {
      return NextResponse.json({ error: "Payment proof not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      proof: {
        ...proof,
        orderId: proof.orderId.toString(),
        invoiceId: proof.invoiceId.toString(),
        pumpId: proof.pumpId.toString(),
        approvedBy: proof.approvedBy?.toString(),
        _id: proof._id?.toString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[PaymentProofsAPI] PUT error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
