import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.pumpId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: employeeId } = await params;
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

    // Get all shifts for this employee in this pump
    const shifts = await shiftsCollection
      .find({
        employeeId: new ObjectId(employeeId),
        pumpId: new ObjectId(session.pumpId),
        startReading: { $exists: true },
        ...dateFilter,
      })
      .sort({ startTime: -1 })
      .toArray();

    const result = shifts.map((shift: any) => ({
      _id: shift._id.toString(),
      date: new Date(shift.startTime).toISOString().split("T")[0],
      fuelType: shift.fuelType,
      startReading: shift.startReading || 0,
      endReading: shift.endReading || null,
      litresSold: shift.litresSold || null,
      amount: shift.amount || null,
      startTime: shift.startTime,
      endTime: shift.endTime || null,
      nozzle: shift.nozzle || "",
      startPhotoUrl: shift.startPhotoUrl || "",
      endPhotoUrl: shift.endPhotoUrl || "",
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("[EmployeeAttendance] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch employee attendance" },
      { status: 500 }
    );
  }
}
