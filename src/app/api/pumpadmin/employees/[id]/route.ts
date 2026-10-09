import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getSession();
    if (!session?.pumpId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    const collection = db.collection("pump_employees");

    // Delete the employee
    const result = await collection.deleteOne({
      _id: new ObjectId(id),
      pumpId: new ObjectId(session.pumpId),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PumpAdminEmployees] DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete employee" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getSession();
    if (!session?.pumpId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    const collection = db.collection("pump_employees");
    const employee = await collection.findOne({
      _id: new ObjectId(id),
      pumpId: new ObjectId(session.pumpId),
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      _id: employee._id.toString(),
      name: employee.name,
      phone: employee.phone,
      role: employee.role,
      username: employee.username,
      createdAt: employee.createdAt,
    });
  } catch (error) {
    console.error("[PumpAdminEmployees] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch employee" },
      { status: 500 }
    );
  }
}
