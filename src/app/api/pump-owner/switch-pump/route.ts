import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPumpById, getPumpsByOwnerEmail } from "@/lib/db/pump-service";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("pump_owner_session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let sessionData: any;
    try {
      sessionData = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { pumpId } = await request.json();

    if (!pumpId || !ObjectId.isValid(pumpId)) {
      return NextResponse.json({ error: "Invalid pump ID" }, { status: 400 });
    }

    // Verify the pump belongs to the same owner
    const pump = await getPumpById(pumpId);
    if (!pump) {
      return NextResponse.json({ error: "Pump not found" }, { status: 404 });
    }

    // Only allow switching to pumps owned by the same email
    if (pump.ownerEmail !== sessionData.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check pump is online
    if (pump.status !== "Online" || pump.accountStatus === "inactive") {
      return NextResponse.json({ error: "Pump is not available" }, { status: 403 });
    }

    // Update session cookie with new pump ID
    const newSession = {
      ...sessionData,
      pumpId: pump._id?.toString(),
    };

    cookieStore.set("pump_owner_session", JSON.stringify(newSession), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });

    return NextResponse.json({ success: true, pumpId: pump._id?.toString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[SwitchPump] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
