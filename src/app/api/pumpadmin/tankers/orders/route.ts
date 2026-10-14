import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  acceptPumpOrder,
  assignTruckToPumpOrder,
  cancelPumpOrder,
  TankerError,
} from "@/lib/db/pump-tanker-service";

// Order actions for the pump admin Tankers page:
//   assign  - give a free truck to an open order (truck becomes busy)
//   accept  - accept a pending order
//   cancel  - cancel an open order (its truck, if any, becomes free)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.pumpId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { action, orderId, truckId, expectedArrival } = body;

    if (action === "assign") {
      if (!orderId || !truckId) {
        return NextResponse.json({ error: "orderId and truckId are required" }, { status: 400 });
      }
      const result = await assignTruckToPumpOrder(
        session.pumpId,
        String(orderId),
        String(truckId),
        expectedArrival ? String(expectedArrival) : null
      );
      return NextResponse.json({ success: true, ...result });
    }

    if (action === "accept") {
      if (!orderId) return NextResponse.json({ error: "orderId is required" }, { status: 400 });
      return NextResponse.json({ success: true, ...(await acceptPumpOrder(session.pumpId, String(orderId))) });
    }

    if (action === "cancel") {
      if (!orderId) return NextResponse.json({ error: "orderId is required" }, { status: 400 });
      return NextResponse.json({ success: true, ...(await cancelPumpOrder(session.pumpId, String(orderId))) });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    if (error instanceof TankerError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[PumpTankers] order action error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
