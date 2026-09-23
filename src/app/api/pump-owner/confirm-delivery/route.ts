import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { confirmDeliveryByPumpOwner, getOrdersByPump } from "@/lib/db/order-service";
import { getPumpById } from "@/lib/db/pump-service";

async function getPumpOwnerId(): Promise<{ pumpId: string; ownerEmail: string } | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("pump_owner_session");
  if (!sessionCookie) return null;

  try {
    const session = JSON.parse(sessionCookie.value);
    if (typeof session.pumpId !== "string" || !ObjectId.isValid(session.pumpId)) return null;

    const pump = await getPumpById(session.pumpId);
    if (!pump) return null;

    return { pumpId: session.pumpId, ownerEmail: pump.ownerEmail };
  } catch {
    return null;
  }
}

const UNAUTHORIZED = { error: "Unauthorized — please log in as Pump Owner first" };

export async function PUT(request: NextRequest) {
  try {
    const owner = await getPumpOwnerId();
    if (!owner) return NextResponse.json(UNAUTHORIZED, { status: 401 });

    const { orderId } = await request.json();

    if (!orderId || !ObjectId.isValid(orderId)) {
      return NextResponse.json({ error: "Missing or invalid orderId" }, { status: 400 });
    }

    const order = await confirmDeliveryByPumpOwner(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.pumpId.toString() !== owner.pumpId) {
      return NextResponse.json({ error: "Unauthorized — not your order" }, { status: 403 });
    }

    return NextResponse.json({ success: true, order: { ...order, pumpId: order.pumpId.toString(), requestedBy: order.requestedBy.toString() } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ConfirmDeliveryAPI] PUT error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
