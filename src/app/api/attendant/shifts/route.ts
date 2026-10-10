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
      dateFilter = { startTime: { $gte: startDate, $lt: endDate } };
    }

    // Get all shifts for this employee
    const shifts = await shiftsCollection
      .find({
        employeeId: new ObjectId(session.employeeId),
        startReading: { $exists: true },
        ...dateFilter,
      })
      .sort({ startTime: -1 })
      .toArray();

    const result = shifts.map((shift: any) => ({
      _id: shift._id.toString(),
      date: new Date(shift.startTime).toISOString().split("T")[0],
      fuelType: shift.fuelType,
      startReading: shift.startReading,
      endReading: shift.endReading,
      litresSold: shift.litresSold,
      amount: shift.amount,
      startTime: shift.startTime,
      endTime: shift.endTime,
      nozzle: shift.nozzle,
      startPhotoUrl: shift.startPhotoUrl,
      endPhotoUrl: shift.endPhotoUrl,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("[AttendantShifts] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shifts" },
      { status: 500 }
    );
  }
}
