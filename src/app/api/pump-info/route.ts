import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getPumpById } from "@/lib/db/pump-service";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.pumpId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pump = await getPumpById(session.pumpId);
    if (!pump) {
      return NextResponse.json({ error: "Pump not found" }, { status: 404 });
    }

    return NextResponse.json({
      pumpName: pump.name,
      pumpId: pump._id?.toString(),
    });
  } catch (error) {
    console.error("[PumpInfo] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pump info" },
      { status: 500 }
    );
  }
}
