import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getPumpTruckDetail, TankerError } from "@/lib/db/pump-tanker-service";

// One truck's details: its current order and the orders it has carried for this pump.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getSession();
    if (!session?.pumpId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const detail = await getPumpTruckDetail(session.pumpId, id);
    return NextResponse.json(detail, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof TankerError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[PumpTankers] detail GET error:", error);
    return NextResponse.json({ error: "Failed to load truck" }, { status: 500 });
  }
}
