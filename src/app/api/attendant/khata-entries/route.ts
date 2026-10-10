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

    const body = await request.json();
    const {
      khataAccountId,
      fuelType,
      litres,
      vehicleNumber,
      driverName,
      department,
      amount,
    } = body;

    if (
      !khataAccountId ||
      !fuelType ||
      !litres ||
      !vehicleNumber ||
      !driverName ||
      !department
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const entriesCollection = db.collection("khata_entries");

    const result = await entriesCollection.insertOne({
      khataAccountId: new ObjectId(khataAccountId),
      attendantId: new ObjectId(session.employeeId),
      attendantName: session.name,
      pumpId: session.pumpId ? new ObjectId(session.pumpId) : null,
      fuelType,
      litres: parseFloat(litres),
      vehicleNumber,
      driverName,
      department,
      amount: parseFloat(amount || "0"),
      date: new Date(),
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      entryId: result.insertedId.toString(),
    });
  } catch (error) {
    console.error("[KhataEntries] POST error:", error);
    return NextResponse.json(
      { error: "Failed to create khata entry" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getEmployeeSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const khataAccountId = request.nextUrl.searchParams.get("khataAccountId");

    if (!khataAccountId) {
      return NextResponse.json(
        { error: "Khata Account ID required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const entriesCollection = db.collection("khata_entries");

    const entries = await entriesCollection
      .find({ khataAccountId: new ObjectId(khataAccountId) })
      .sort({ date: -1 })
      .toArray();

    return NextResponse.json(
      entries.map((entry: any) => ({
        _id: entry._id.toString(),
        attendantName: entry.attendantName,
        fuelType: entry.fuelType,
        litres: entry.litres,
        vehicleNumber: entry.vehicleNumber,
        driverName: entry.driverName,
        amount: entry.amount,
        date: entry.date,
      }))
    );
  } catch (error) {
    console.error("[KhataEntries] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch khata entries" },
      { status: 500 }
    );
  }
}
