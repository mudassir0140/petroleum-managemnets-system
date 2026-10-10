import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import crypto from "crypto";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.pumpId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    const collection = db.collection("khataClients");
    const clients = await collection
      .find({ pumpId: new ObjectId(session.pumpId) })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(
      clients.map((client: any) => ({
        _id: client._id.toString(),
        clientName: client.clientName,
        department: client.department,
        username: client.username,
        numberOfVehicles: client.numberOfVehicles,
        vehicleTypes: client.vehicleTypes,
        createdAt: client.createdAt,
      }))
    );
  } catch (error) {
    console.error("[Khata Clients] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch khata clients" },
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
      clientName,
      department,
      numberOfVehicles,
      vehicleTypes,
    } = body;

    if (!clientName || !department || !numberOfVehicles || !vehicleTypes) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection("khataClients");

    // Generate unique username and password
    const username = `khata_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const password = crypto.randomBytes(8).toString("hex");

    const result = await collection.insertOne({
      pumpId: new ObjectId(session.pumpId),
      clientName,
      department,
      numberOfVehicles: parseInt(numberOfVehicles),
      vehicleTypes: Array.isArray(vehicleTypes) ? vehicleTypes : [vehicleTypes],
      username,
      password, // In production, hash this
      totalFuelAmount: 0,
      totalPaid: 0,
      advancePaid: 0,
      remainingBalance: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      _id: result.insertedId.toString(),
      clientName,
      department,
      username,
      password,
      numberOfVehicles,
      vehicleTypes,
      totalFuelAmount: 0,
      totalPaid: 0,
      advancePaid: 0,
      remainingBalance: 0,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("[Khata Clients] POST error:", error);
    return NextResponse.json(
      { error: "Failed to create khata client" },
      { status: 500 }
    );
  }
}
