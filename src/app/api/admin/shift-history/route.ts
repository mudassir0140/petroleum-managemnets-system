import { NextRequest, NextResponse } from "next/server";
import { getEmployeeSession } from "@/lib/employee/session";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const session = await getEmployeeSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employeeId = request.nextUrl.searchParams.get("employeeId");
    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const shiftsCollection = db.collection("shifts");
    const employeesCollection = db.collection("employees");

    // Verify the employee exists and check access
    const employee = await employeesCollection.findOne({
      _id: new ObjectId(employeeId),
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Role-based access control
    if (session.role === "pump-attendant") {
      // Attendants can only see their own data
      if (session.employeeId !== employeeId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (session.role === "pump-owner") {
      // Pump owners can see their pump's employees
      if (employee.pumpId?.toString() !== session.pumpId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (session.role !== "company-owner" && session.role !== "hr-manager") {
      // Admin/HR can see all
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch shift history for this employee
    const shifts = await shiftsCollection
      .find({
        employeeId: new ObjectId(employeeId),
        startReading: { $exists: true },
      })
      .sort({ startTime: -1 })
      .toArray();

    const result = shifts.map((shift: any) => ({
      _id: shift._id.toString(),
      fuelType: shift.fuelType,
      startReading: shift.startReading,
      endReading: shift.endReading,
      litresSold: shift.litresSold,
      amount: shift.amount,
      startTime: shift.startTime,
      endTime: shift.endTime,
      nozzle: shift.nozzle || "",
      startPhotoUrl: shift.startPhotoUrl,
      endPhotoUrl: shift.endPhotoUrl,
    }));

    return NextResponse.json({ shiftHistory: result });
  } catch (error) {
    console.error("[AdminShiftHistory] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shift history" },
      { status: 500 }
    );
  }
}
