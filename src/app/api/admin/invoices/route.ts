import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { createInvoice, getInvoicesByPump } from "@/lib/db/invoice-service";

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
    const adminId = await getAdminId();
    if (!adminId) return NextResponse.json(UNAUTHORIZED, { status: 401 });

    const { orderId, pumpId, pumpName, fuelType, quantityLitres, unitPrice } = await request.json();

    if (!orderId || !ObjectId.isValid(orderId)) {
      return NextResponse.json({ error: "Missing or invalid orderId" }, { status: 400 });
    }
    if (!pumpId || !ObjectId.isValid(pumpId)) {
      return NextResponse.json({ error: "Missing or invalid pumpId" }, { status: 400 });
    }
    if (!pumpName || !fuelType || typeof quantityLitres !== "number" || typeof unitPrice !== "number") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const totalAmount = quantityLitres * unitPrice;

    const invoice = await createInvoice({
      orderId: new ObjectId(orderId),
      pumpId: new ObjectId(pumpId),
      pumpName,
      fuelType: fuelType as "petrol" | "diesel",
      quantityLitres,
      unitPrice,
      totalAmount,
      issuedAt: new Date(),
    });

    return NextResponse.json({ success: true, invoice: { ...invoice, orderId: invoice.orderId.toString(), pumpId: invoice.pumpId.toString(), _id: invoice._id?.toString() } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[InvoicesAPI] POST error:", message);
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

    const invoices = await getInvoicesByPump(pumpId);
    return NextResponse.json({
      success: true,
      invoices: invoices.map((inv) => ({ ...inv, orderId: inv.orderId.toString(), pumpId: inv.pumpId.toString(), _id: inv._id?.toString() })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[InvoicesAPI] GET error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
