import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { getPumpById } from "@/lib/db/pump-service";
import { confirmDeliveryAsDestination } from "@/lib/truck/delivery";

export const dynamic = "force-dynamic";

// The pump owner of the destination pump is the only one who can confirm a delivery.
async function getPumpOwnerId(): Promise<{ pumpId: string } | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("pump_owner_session");
  if (!sessionCookie) return null;

  try {
    const session = JSON.parse(sessionCookie.value);
    if (typeof session.pumpId !== "string" || !ObjectId.isValid(session.pumpId)) return null;

    const pump = await getPumpById(session.pumpId);
    if (!pump) return null;

    return { pumpId: session.pumpId };
  } catch {
    return null;
  }
}

const UNAUTHORIZED = { error: "Unauthorized — please log in as Pump Owner first" };

export async function PUT(request: NextRequest) {
  try {
    const owner = await getPumpOwnerId();
    if (!owner) return NextResponse.json(UNAUTHORIZED, { status: 401 });

    const body = await request.json().catch(() => null);
    const orderId = typeof body?.orderId === "string" ? body.orderId : "";
    if (!ObjectId.isValid(orderId)) {
      return NextResponse.json({ error: "Missing or invalid orderId" }, { status: 400 });
    }

    // The pump id comes from the session, so an order of another pump is never found.
    const result = await confirmDeliveryAsDestination(new ObjectId(owner.pumpId), new ObjectId(orderId));
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ success: true, order: result.data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ConfirmDeliveryAPI] PUT error:", message);
    return NextResponse.json({ error: "Failed to confirm the delivery" }, { status: 500 });
  }
}
