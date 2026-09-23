import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { createOrder, getAllOrders, updateOrderStatus } from "@/lib/db/order-service";
import { getPumpById } from "@/lib/db/pump-service";

// Same pattern as api/admin/pumps: adminId must be a real ObjectId or the
// session is treated as logged out, not passed through to the driver.
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

  const orders = await getAllOrders();
  return NextResponse.json({
    success: true,
    orders: orders.map((o) => ({ ...o, pumpId: o.pumpId.toString(), requestedBy: o.requestedBy.toString() })),
  });
}

export async function POST(request: NextRequest) {
  try {
    const adminId = await getAdminId();
    if (!adminId) return NextResponse.json(UNAUTHORIZED, { status: 401 });

    const { pumpId, fuelType, quantityLitres, notes } = await request.json();

    if (!pumpId || !ObjectId.isValid(pumpId)) {
      return NextResponse.json({ error: "Missing or invalid pumpId" }, { status: 400 });
    }
    if (fuelType !== "petrol" && fuelType !== "diesel") {
      return NextResponse.json({ error: "fuelType must be 'petrol' or 'diesel'" }, { status: 400 });
    }
    if (typeof quantityLitres !== "number" || quantityLitres <= 0) {
      return NextResponse.json({ error: "quantityLitres must be a positive number" }, { status: 400 });
    }

    const pump = await getPumpById(pumpId);
    if (!pump) {
      return NextResponse.json({ error: "Pump not found" }, { status: 404 });
    }

    const order = await createOrder(
      { pumpId: new ObjectId(pumpId), pumpName: pump.name, fuelType, quantityLitres, notes: notes || undefined },
      adminId
    );

    return NextResponse.json({ success: true, order: { ...order, pumpId: order.pumpId.toString() } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[OrdersAPI] POST error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminId = await getAdminId();
    if (!adminId) return NextResponse.json(UNAUTHORIZED, { status: 401 });

    const { orderId, status } = await request.json();
    if (!orderId || !ObjectId.isValid(orderId)) {
      return NextResponse.json({ error: "Missing or invalid orderId" }, { status: 400 });
    }
    if (!["pending", "dispatched", "delivered"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const order = await updateOrderStatus(orderId, status);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, order: { ...order, pumpId: order.pumpId.toString() } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
