import { NextRequest, NextResponse } from "next/server";
import { getEmployeeSession } from "@/lib/employee/session";
import { getDatabase } from "@/lib/db/mongodb";
import { getCurrentFuelRates } from "@/lib/db/fuel-rates";
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
    const litresSold = Math.max(0, reading - (activeShift.startReading || 0));

    // Get current fuel rate based on fuel type and pump. The start form stores
    // "Petrol" / "Diesel" in capitals, so compare case-insensitively.
    const rates = await getCurrentFuelRates(session.pumpId);
    const isDiesel = String(activeShift.fuelType || "").trim().toLowerCase() === "diesel";
    const fuelLabel = isDiesel ? "Diesel" : "Petrol";
    const fuelPrice = isDiesel
      ? (rates?.dieselRate || 0)
      : (rates?.petrolRate || 0);
    const rateMissing = !fuelPrice;
    const amount = Math.round(Math.max(0, litresSold * fuelPrice) * 100) / 100;

    // Update the shift record with end data and rate at time of completion
    await shiftsCollection.updateOne(
      { _id: activeShift._id },
      {
        $set: {
          endReading: reading,
          endTime: new Date(),
          endPhotoUrl: photo ? `/uploads/shifts/${Date.now()}-${photo.name}` : null,
          litresSold,
          rateUsed: fuelPrice,
          amount,
          updatedAt: new Date(),
        },
      }
    );

    // A shift records one fuel type, so the breakdown has one line.
    return NextResponse.json({
      success: true,
      shiftId: activeShift._id.toString(),
      fuelType: fuelLabel,
      startReading: activeShift.startReading || 0,
      endReading: reading,
      litresSold,
      rateUsed: fuelPrice,
      rateMissing,
      breakdown: [{ fuelType: fuelLabel, litres: litresSold, rate: fuelPrice, amount }],
      totalAmount: amount,
      amount,
    });
  } catch (error) {
    console.error("[AttendantShifts] end error:", error);
    return NextResponse.json(
      { error: "Failed to end shift" },
      { status: 500 }
    );
  }
}
