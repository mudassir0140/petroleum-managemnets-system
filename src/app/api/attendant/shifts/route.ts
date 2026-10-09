import { NextRequest, NextResponse } from "next/server";
import { getEmployeeSession } from "@/lib/employee/session";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const session = await getEmployeeSession();
    if (!session || session.role !== "pump-attendant") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const month = request.nextUrl.searchParams.get("month");

    const db = await getDatabase();
    const shiftsCollection = db.collection("shifts");

    // Parse month filter
    let dateFilter: any = {};
    if (month) {
      const [year, monthNum] = month.split("-");
      const startDate = new Date(`${year}-${monthNum}-01`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      dateFilter = { createdAt: { $gte: startDate, $lt: endDate } };
    }

    // Get all shifts for this employee
    const shifts = await shiftsCollection
      .find({
        employeeId: new ObjectId(session.employeeId),
        ...dateFilter,
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Group start and end shifts by date
    const groupedShifts = new Map<string, any>();

    for (const shift of shifts) {
      const dateKey = new Date(shift.createdAt).toISOString().split("T")[0];

      if (!groupedShifts.has(dateKey)) {
        groupedShifts.set(dateKey, {
          date: dateKey,
          fuelType: shift.fuelType,
          startReading: null,
          endReading: null,
          litresSold: null,
          amount: null,
          photoUrl: null,
        });
      }

      const record = groupedShifts.get(dateKey);
      if (shift.type === "start") {
        record.startReading = shift.startReading;
        record.fuelType = shift.fuelType;
        if (shift.photoUrl) record.photoUrl = shift.photoUrl;
      } else if (shift.type === "end") {
        record.endReading = shift.endReading;
        record.litresSold = shift.litresSold;
        record.amount = shift.amount;
        if (shift.photoUrl) record.endPhotoUrl = shift.photoUrl;
      }
    }

    const result = Array.from(groupedShifts.values());

    return NextResponse.json(result);
  } catch (error) {
    console.error("[AttendantShifts] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shifts" },
      { status: 500 }
    );
  }
}
