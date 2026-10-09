import { NextResponse } from "next/server";
import { getEmployeeSession } from "@/lib/employee/session";
import { getDatabase } from "@/lib/db/mongodb";
import { getPumpById } from "@/lib/db/pump-service";

export async function GET() {
  try {
    const session = await getEmployeeSession();

    // Only company owner or HR manager can access pump employees
    if (!session || (session.role !== "company-owner" && session.role !== "hr-manager")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    const collection = db.collection("pump_employees");

    // Get all pump employees
    const employees = await collection.find({}).toArray();

    // Fetch pump names for each employee
    const result = [];
    for (const emp of employees) {
      const pump = await getPumpById(emp.pumpId.toString());
      result.push({
        _id: emp._id.toString(),
        name: emp.name,
        phone: emp.phone,
        role: emp.role,
        username: emp.username,
        shiftHours: emp.shiftHours || 8,
        createdAt: emp.createdAt,
        pumpId: emp.pumpId.toString(),
        pumpName: pump?.name || "Unknown Pump",
        addedBy: "Pump Owner",
        addedByUrdu: "پمپ اونر",
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[AdminPumpEmployees] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}
