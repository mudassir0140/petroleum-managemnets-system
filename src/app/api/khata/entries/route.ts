import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.pumpId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const khataClientId = searchParams.get("khataClientId");

    const db = await getDatabase();
    const collection = db.collection("khataEntries");

    const query: any = { pumpId: new ObjectId(session.pumpId) };
    if (khataClientId) {
      query.khataClientId = new ObjectId(khataClientId);
    }

    const entries = await collection
      .find(query)
      .sort({ date: -1 })
      .toArray();

    return NextResponse.json(
      entries.map((entry: any) => ({
        _id: entry._id.toString(),
        khataClientId: entry.khataClientId.toString(),
        fuelType: entry.fuelType,
        litres: entry.litres,
        vehicleNumber: entry.vehicleNumber,
        driverName: entry.driverName,
        amount: entry.amount,
        date: entry.date,
        attendantId: entry.attendantId,
        attendantName: entry.attendantName,
      }))
    );
  } catch (error) {
    console.error("[Khata Entries] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch khata entries" },
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
    const {
      khataClientId,
      fuelType,
      litres,
      vehicleNumber,
      driverName,
      attendantId,
      attendantName,
      dailyRate,
    } = body;

    if (!khataClientId || !fuelType || !litres || !vehicleNumber) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const entriesCollection = db.collection("khataEntries");
    const clientsCollection = db.collection("khataClients");

    const amount = parseFloat(litres) * parseFloat(dailyRate || 0);

    const result = await entriesCollection.insertOne({
      pumpId: new ObjectId(session.pumpId),
      khataClientId: new ObjectId(khataClientId),
      fuelType,
      litres: parseFloat(litres),
      vehicleNumber,
      driverName: driverName || "",
      amount,
      date: new Date().toISOString(),
      attendantId: attendantId || "",
      attendantName: attendantName || "",
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
      _id: result.insertedId.toString(),
      khataClientId,
      fuelType,
      litres,
      vehicleNumber,
      driverName,
      amount,
      date: new Date().toISOString(),
      attendantId,
      attendantName,
    });
  } catch (error) {
    console.error("[Khata Entries] POST error:", error);
    return NextResponse.json(
      { error: "Failed to create khata entry" },
      { status: 500 }
    );
  }
}
