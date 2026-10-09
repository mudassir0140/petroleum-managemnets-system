import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createShift, getShiftsByPump } from "@/lib/db/shift-service";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.pumpId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "30", 10);

    const shifts = await getShiftsByPump(session.pumpId, days);
    return NextResponse.json(
      shifts.map((s) => ({
        ...s,
        _id: s._id?.toString(),
        pumpId: s.pumpId.toString(),
        employeeId: s.employeeId.toString(),
      }))
    );
  } catch (error) {
    console.error("[Shifts API] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shifts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.pumpId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { employeeId, attendantName, attendantEmail } = body;

    if (!employeeId || !attendantName || !attendantEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const shift = await createShift(session.pumpId, employeeId, attendantName, attendantEmail);
    if (!shift) {
      return NextResponse.json(
        { error: "Failed to create shift" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...shift,
      _id: shift._id?.toString(),
      pumpId: shift.pumpId.toString(),
      employeeId: shift.employeeId.toString(),
    });
  } catch (error) {
    console.error("[Shifts API] POST error:", error);
    return NextResponse.json(
      { error: "Failed to create shift" },
      { status: 500 }
    );
  }
}
