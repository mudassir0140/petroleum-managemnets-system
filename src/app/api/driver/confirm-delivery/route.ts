import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { confirmDeliveryByDriver, getOrdersByDriver } from "@/lib/db/order-service";

async function getDriverId(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("driver_session");
  if (!sessionCookie) return null;

  try {
    const session = JSON.parse(sessionCookie.value);
    if (typeof session.driverId !== "string" || !ObjectId.isValid(session.driverId)) return null;
    return session.driverId;
  } catch {
    return null;
  }
}

const UNAUTHORIZED = { error: "Unauthorized — please log in as Driver first" };

export async function PUT(request: NextRequest) {
  try {
    const driverId = await getDriverId();
    if (!driverId) return NextResponse.json(UNAUTHORIZED, { status: 401 });

    const { orderId } = await request.json();

    if (!orderId || !ObjectId.isValid(orderId)) {
      return NextResponse.json({ error: "Missing or invalid orderId" }, { status: 400 });
    }

    const order = await confirmDeliveryByDriver(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.driverId?.toString() !== driverId) {
      return NextResponse.json({ error: "Unauthorized — not your order" }, { status: 403 });
    }

    return NextResponse.json({ success: true, order: { ...order, pumpId: order.pumpId.toString(), requestedBy: order.requestedBy.toString(), driverId: order.driverId?.toString() } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[DriverConfirmDeliveryAPI] PUT error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
