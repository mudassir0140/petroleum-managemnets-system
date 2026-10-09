import { NextRequest, NextResponse } from "next/server";
import { getEmployeeSession } from "@/lib/employee/session";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const session = await getEmployeeSession();
    if (!session || session.role !== "pump-attendant") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const reading = parseFloat(formData.get("reading")?.toString() || "0");
    const photo = formData.get("photo") as File | null;

    if (!reading) {
      return NextResponse.json(
        { error: "Reading is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const shiftsCollection = db.collection("shifts");

    // Find the latest start shift record for this employee today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startShift = await shiftsCollection.findOne({
      employeeId: new ObjectId(session.employeeId),
      type: "start",
      createdAt: { $gte: today, $lt: tomorrow },
    });

    if (!startShift) {
      return NextResponse.json(
        { error: "No active shift found" },
        { status: 404 }
      );
    }

    // Calculate litres and amount
    const litresSold = reading - (startShift.startReading || 0);
    const fuelPrice = 200; // Default price, can be updated
    const amount = litresSold * fuelPrice;

    // Save shift end record
    const result = await shiftsCollection.insertOne({
      employeeId: new ObjectId(session.employeeId),
      pumpId: session.pumpId ? new ObjectId(session.pumpId) : null,
      type: "end",
      endReading: reading,
      litresSold: Math.max(0, litresSold),
      amount: Math.max(0, amount),
      photoUrl: photo ? `/uploads/shifts/${Date.now()}-${photo.name}` : null,
      linkedStartId: startShift._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      shiftId: result.insertedId.toString(),
      litresSold: Math.max(0, litresSold),
      amount: Math.max(0, amount),
    });
  } catch (error) {
    console.error("[AttendantShifts] end error:", error);
    return NextResponse.json(
      { error: "Failed to end shift" },
      { status: 500 }
    );
  }
}
