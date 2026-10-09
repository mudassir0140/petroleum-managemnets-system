import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("employee_session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie);
    const { fuelType, pumpPoint, startReading, photoDataUrl } = await request.json();

    if (!fuelType || !pumpPoint || startReading === undefined || !photoDataUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const shiftsCollection = db.collection("attendant_shifts");

    const shift = await shiftsCollection.insertOne({
      employeeId: session.userId,
      pumpId: session.pumpId,
      fuelType,
      pumpPoint,
      startReading,
      startPhoto: photoDataUrl,
      startTime: new Date(),
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      shiftId: shift.insertedId.toString(),
      success: true,
    });
  } catch (error) {
    console.error("[AttendantShiftStart] error:", error);
    return NextResponse.json(
      { error: "Failed to start shift" },
      { status: 500 }
    );
  }
}
