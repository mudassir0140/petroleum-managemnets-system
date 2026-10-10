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
    const fuelType = formData.get("fuelType")?.toString();
    const reading = parseFloat(formData.get("reading")?.toString() || "0");
    const photo = formData.get("photo") as File | null;
    const nozzle = formData.get("nozzle")?.toString() || "";

    if (!fuelType || !reading) {
      return NextResponse.json(
        { error: "Fuel type and reading are required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const shiftsCollection = db.collection("shifts");

    // Create a unified shift record with start data
    const result = await shiftsCollection.insertOne({
      employeeId: new ObjectId(session.employeeId),
      pumpId: session.pumpId ? new ObjectId(session.pumpId) : null,
      fuelType,
      startReading: reading,
      startPhotoUrl: photo ? `/uploads/shifts/${Date.now()}-${photo.name}` : null,
      startTime: new Date(),
      nozzle,
      endReading: null,
      endPhotoUrl: null,
      endTime: null,
      litresSold: null,
      amount: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      shiftId: result.insertedId.toString(),
    });
  } catch (error) {
    console.error("[AttendantShifts] start error:", error);
    return NextResponse.json(
      { error: "Failed to start shift" },
      { status: 500 }
    );
  }
}
