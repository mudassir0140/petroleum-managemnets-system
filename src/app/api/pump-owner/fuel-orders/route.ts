import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { createOrder, getOrdersByPump } from "@/lib/db/order-service";
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

export async function POST(request: NextRequest) {
  try {
    const owner = await getPumpOwnerId();
    if (!owner) return NextResponse.json(UNAUTHORIZED, { status: 401 });

    const { pumpId, fuelType, quantityLitres, notes } = await request.json();

    // Verify the pump owner is requesting fuel for their own pump
    if (pumpId !== owner.pumpId) {
      return NextResponse.json({ error: "Unauthorized — not your pump" }, { status: 403 });
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
      owner.pumpId // Use pumpId as requestedBy for pump owner requests
    );

    return NextResponse.json({ success: true, order: { ...order, pumpId: order.pumpId.toString(), requestedBy: order.requestedBy.toString() } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[FuelOrdersAPI] POST error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const owner = await getPumpOwnerId();
    if (!owner) return NextResponse.json(UNAUTHORIZED, { status: 401 });

    const orders = await getOrdersByPump(owner.pumpId);
    return NextResponse.json({
      success: true,
      orders: orders.map((o) => ({
        ...o,
        pumpId: o.pumpId.toString(),
        requestedBy: o.requestedBy.toString(),
        driverId: o.driverId?.toString(),
        invoiceId: o.invoiceId?.toString(),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[FuelOrdersAPI] GET error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
