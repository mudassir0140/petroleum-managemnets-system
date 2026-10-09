"use server";

import { getDatabase } from "@/lib/db/mongodb";
import { getEmployeeSession } from "@/lib/employee/session";
import { ObjectId } from "mongodb";
import type { EmployeeRecord } from "@/lib/db/models";

export async function GET() {
  try {
    const session = await getEmployeeSession();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    const collection = db.collection<EmployeeRecord>("employees");

    const employee = await collection.findOne({
      _id: new ObjectId(session.employeeId),
    });

    if (!employee) {
      return Response.json({ error: "Employee not found" }, { status: 404 });
    }

    // Get employees at the same pump
    const pumpEmployees = await collection
      .find({
        pumpId: employee.pumpId,
        status: "active",
      })
      .sort({ name: 1 })
      .toArray();

    const getPumpName = async (pumpId: ObjectId | undefined) => {
      if (!pumpId) return "N/A";
      const pumpCollection = db.collection("pumps");
      const pump = await pumpCollection.findOne({ _id: pumpId });
      return pump?.name || "N/A";
    };

    const pumpName = await getPumpName(employee.pumpId);

    return Response.json({
      success: true,
      employee: {
        id: employee._id.toString(),
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
        pumpId: employee.pumpId?.toString(),
        pumpName,
        status: employee.status,
      },
      pumpEmployees: pumpEmployees.map((emp) => ({
        id: emp._id.toString(),
        name: emp.name,
        phone: emp.phone,
        role: emp.role,
        email: emp.email,
      })),
    });
  } catch (error) {
    console.error("[ProfileAPI] error:", error);
    return Response.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
