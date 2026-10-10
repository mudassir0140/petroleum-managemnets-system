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

    // Find the active shift (without endReading) for this employee
    const activeShift = await shiftsCollection.findOne({
      employeeId: new ObjectId(session.employeeId),
      endReading: null,
      startReading: { $exists: true },
    });

    if (!activeShift) {
      return NextResponse.json(
        { error: "No active shift found" },
        { status: 404 }
      );
    }

    // Calculate litres and amount
    const litresSold = reading - (activeShift.startReading || 0);
    const fuelPrice = 200; // Default price, can be updated
    const amount = litresSold * fuelPrice;

    // Update the shift record with end data
    await shiftsCollection.updateOne(
      { _id: activeShift._id },
      {
        $set: {
          endReading: reading,
          endTime: new Date(),
          endPhotoUrl: photo ? `/uploads/shifts/${Date.now()}-${photo.name}` : null,
          litresSold: Math.max(0, litresSold),
          amount: Math.max(0, amount),
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      shiftId: activeShift._id.toString(),
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
