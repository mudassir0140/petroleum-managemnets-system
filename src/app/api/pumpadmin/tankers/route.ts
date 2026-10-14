import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createPumpTruck, getPumpTankerBoard, TankerError } from "@/lib/db/pump-tanker-service";

// Board for the pump admin Tankers page: trucks, upcoming trips and new requests.
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.pumpId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const board = await getPumpTankerBoard(session.pumpId);
    return NextResponse.json(board, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[PumpTankers] GET error:", error);
    return NextResponse.json({ error: "Failed to load tankers" }, { status: 500 });
  }
}

// Registers a truck and creates the driver's login account for this pump.
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.pumpId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const result = await createPumpTruck(session.pumpId, {
      driverName: body.driverName,
      truckNumber: body.truckNumber,
      truckType: body.truckType,
      password: body.password,
    });
    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error) {
    if (error instanceof TankerError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[PumpTankers] POST error:", error);
    return NextResponse.json({ error: "Failed to create truck" }, { status: 500 });
  }
}
