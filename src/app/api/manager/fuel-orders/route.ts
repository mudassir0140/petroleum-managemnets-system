import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { getOrdersByPump, updateOrderStatus } from "@/lib/db/order-service";
import { getPumpById } from "@/lib/db/pump-service";

async function getManagerId(): Promise<{ managerId: string; pumpId: string } | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("manager_session");
  if (!sessionCookie) return null;

  try {
    const session = JSON.parse(sessionCookie.value);
    if (typeof session.managerId !== "string" || !ObjectId.isValid(session.managerId)) return null;
    if (typeof session.pumpId !== "string" || !ObjectId.isValid(session.pumpId)) return null;
    return { managerId: session.managerId, pumpId: session.pumpId };
  } catch {
    return null;
  }
}

const UNAUTHORIZED = { error: "Unauthorized — please log in as Manager first" };

export async function GET() {
  const manager = await getManagerId();
  if (!manager) return NextResponse.json(UNAUTHORIZED, { status: 401 });

  const orders = await getOrdersByPump(manager.pumpId);
  return NextResponse.json({
    success: true,
    orders: orders.map((o) => ({ ...o, pumpId: o.pumpId.toString(), requestedBy: o.requestedBy.toString(), driverId: o.driverId?.toString() })),
  });
}

export async function PUT(request: NextRequest) {
  try {
    const manager = await getManagerId();
    if (!manager) return NextResponse.json(UNAUTHORIZED, { status: 401 });

    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !ObjectId.isValid(orderId)) {
      return NextResponse.json({ error: "Missing or invalid orderId" }, { status: 400 });
    }

    if (!["accepted", "on-the-way"].includes(status)) {
      return NextResponse.json({ error: "Invalid status for manager" }, { status: 400 });
    }

    const order = await updateOrderStatus(orderId, status as any);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.pumpId.toString() !== manager.pumpId) {
      return NextResponse.json({ error: "Unauthorized — not your pump" }, { status: 403 });
    }

    return NextResponse.json({ success: true, order: { ...order, pumpId: order.pumpId.toString(), requestedBy: order.requestedBy.toString(), driverId: order.driverId?.toString() } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ManagerFuelOrdersAPI] PUT error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
