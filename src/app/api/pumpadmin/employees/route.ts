import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDatabase } from "@/lib/db/mongodb";
import { hashPassword } from "@/lib/auth/password";
import { ObjectId } from "mongodb";
import { generateRandomString } from "@/lib/utils";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.pumpId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    const collection = db.collection("pump_employees");
    const employees = await collection
      .find({ pumpId: new ObjectId(session.pumpId) })
      .toArray();

    return NextResponse.json(employees.map((emp: any) => ({
      _id: emp._id.toString(),
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      role: emp.role,
      createdAt: emp.createdAt,
    })));
  } catch (error) {
    console.error("[PumpAdminEmployees] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.pumpId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, role } = body;

    if (!name || !email || !phone || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection("pump_employees");

    const existing = await collection.findOne({
      email: email.toLowerCase(),
      pumpId: new ObjectId(session.pumpId),
    });

    if (existing) {
      return NextResponse.json(
        { error: "Employee with this email already exists" },
        { status: 400 }
      );
    }

    const password = generateRandomString(12);
    const passwordHash = hashPassword(password);

    const result = await collection.insertOne({
      pumpId: new ObjectId(session.pumpId),
      name,
      email: email.toLowerCase(),
      phone,
      role,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      _id: result.insertedId.toString(),
      name,
      email,
      phone,
      role,
      password,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("[PumpAdminEmployees] POST error:", error);
    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 }
    );
  }
}
