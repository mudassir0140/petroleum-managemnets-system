import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { updatePumpStatus } from "@/lib/db/pump-service";
import { cookies } from "next/headers";

async function getAdminId(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("admin_session");
  if (!sessionCookie) return null;

  try {
    const session = JSON.parse(sessionCookie.value);
    if (typeof session.adminId !== "string" || !ObjectId.isValid(session.adminId)) return null;
    return session.adminId;
  } catch {
    return null;
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminId = await getAdminId();
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { pumpId, status } = body;

    if (!pumpId || !ObjectId.isValid(pumpId) || !status) {
      return NextResponse.json(
        { error: "Missing/invalid pumpId or status" },
        { status: 400 }
      );
    }

    if (!["Online", "Offline", "Maintenance"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const updated = await updatePumpStatus(pumpId, status);
    if (!updated) {
      return NextResponse.json({ error: "Pump not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Pump status updated to ${status}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
