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
      khataClientId,
      fuelType,
      litres,
      vehicleNumber,
      driverName,
      givenRate,
    } = body;

    if (
      !khataClientId ||
      !fuelType ||
      !litres ||
      !vehicleNumber ||
      !driverName ||
      givenRate === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const entriesCollection = db.collection("khataEntries");
    const clientsCollection = db.collection("khataClients");

    // Verify the khata client belongs to the attendant's pump
    const client = await clientsCollection.findOne({
      _id: new ObjectId(khataClientId),
      pumpId: session.pumpId ? new ObjectId(session.pumpId) : null,
    });

    if (!client) {
      return NextResponse.json(
        { error: "Khata client not found or unauthorized" },
        { status: 404 }
      );
    }

    const rateNum = parseFloat(givenRate);
    const litresNum = parseFloat(litres);
    const amount = litresNum * rateNum;

    const result = await entriesCollection.insertOne({
      khataClientId: new ObjectId(khataClientId),
      attendantId: new ObjectId(session.employeeId),
      attendantName: session.name || "",
      pumpId: session.pumpId ? new ObjectId(session.pumpId) : null,
      fuelType,
      litres: litresNum,
      vehicleNumber,
      driverName,
      givenRate: rateNum,
      amount,
      date: new Date().toISOString(),
      createdAt: new Date(),
    });

    // Update khata client balance
    await clientsCollection.updateOne(
      { _id: new ObjectId(khataClientId) },
      {
        $inc: {
          totalFuelAmount: amount,
          remainingBalance: amount,
        },
      }
    );

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

    const khataClientId = request.nextUrl.searchParams.get("khataClientId");

    if (!khataClientId) {
      return NextResponse.json(
        { error: "Khata Client ID required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const entriesCollection = db.collection("khataEntries");

    const entries = await entriesCollection
      .find({ khataClientId: new ObjectId(khataClientId) })
      .sort({ date: -1 })
      .toArray();

    return NextResponse.json(
      entries.map((entry: any) => ({
        _id: entry._id.toString(),
        attendantName: entry.attendantName || "",
        fuelType: entry.fuelType,
        litres: entry.litres || 0,
        vehicleNumber: entry.vehicleNumber,
        driverName: entry.driverName,
        amount: entry.amount || 0,
        givenRate: entry.givenRate || 0,
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
