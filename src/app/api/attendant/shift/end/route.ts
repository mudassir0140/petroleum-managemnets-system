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
    const { endReading, photoDataUrl } = await request.json();

    if (endReading === undefined || !photoDataUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const shiftsCollection = db.collection("attendant_shifts");
    const pumpsCollection = db.collection("pumps");

    // Get the active shift
    const activeShift = await shiftsCollection.findOne({
      employeeId: session.userId,
      pumpId: session.pumpId,
      status: "active",
    });

    if (!activeShift) {
      return NextResponse.json(
        { error: "No active shift found" },
        { status: 404 }
      );
    }

    // Calculate litres sold
    const litresSold = endReading - activeShift.startReading;

    // Get today's fuel rate from the pump
    const pump = await pumpsCollection.findOne({
      _id: new ObjectId(session.pumpId),
    });

    if (!pump) {
      return NextResponse.json({ error: "Pump not found" }, { status: 404 });
    }

    // Get the fuel rate (this would typically be from the pump's fuel rates collection)
    // For now, using a default rate of 300 per liter
    const fuelRateCollection = db.collection("fuel_rates");
    const today = new Date().toISOString().split("T")[0];
    const fuelRate = await fuelRateCollection.findOne({
      pumpId: new ObjectId(session.pumpId),
      date: today,
      fuelType: activeShift.fuelType,
    });

    const rate = fuelRate?.rate || 300;
    const amountDue = litresSold * rate;

    // Calculate overtime if applicable
    const endTime = new Date();
    const expectedEndTime = activeShift.expectedEndTime || activeShift.startTime;
    const actualDurationMs = endTime.getTime() - activeShift.startTime.getTime();
    const expectedDurationMs = expectedEndTime.getTime() - activeShift.startTime.getTime();
    const isOvertime = actualDurationMs > expectedDurationMs;
    const overtimeHours = isOvertime ? (actualDurationMs - expectedDurationMs) / (1000 * 60 * 60) : 0;

    // Update the shift with end reading and close it
    await shiftsCollection.updateOne(
      { _id: activeShift._id },
      {
        $set: {
          endReading,
          endPhoto: photoDataUrl,
          endTime,
          litresSold,
          amountDue,
          rate,
          isOvertime,
          overtimeHours: Math.round(overtimeHours * 100) / 100,
          status: "closed",
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      shiftId: activeShift._id.toString(),
      litresSold,
      amountDue,
      isOvertime,
      overtimeHours: Math.round(overtimeHours * 100) / 100,
      success: true,
    });
  } catch (error) {
    console.error("[AttendantShiftEnd] error:", error);
    return NextResponse.json(
      { error: "Failed to end shift" },
      { status: 500 }
    );
  }
}
