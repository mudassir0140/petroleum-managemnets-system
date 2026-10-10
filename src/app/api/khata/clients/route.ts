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
        petrolGivenRate: client.petrolGivenRate ?? 0,
        dieselGivenRate: client.dieselGivenRate ?? 0,
        petrolActualRate: client.petrolActualRate ?? 0,
        dieselActualRate: client.dieselActualRate ?? 0,
        totalFuelAmount: client.totalFuelAmount ?? 0,
        remainingBalance: client.remainingBalance ?? 0,
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
      phone,
      password,
      username,
      date,
      openingAmount,
      numberOfVehicles,
      vehicleTypes,
      petrolActualRate,
      petrolGivenRate,
      dieselActualRate,
      dieselGivenRate,
    } = body;

    if (!clientName || !department || !phone || !password || !username) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection("khataClients");

    // Normalize username to lowercase for consistent comparison
    const normalizedUsername = username.trim().toLowerCase();

    // Check if username already exists
    const existing = await collection.findOne({ username: normalizedUsername });
    if (existing) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 400 }
      );
    }

    const result = await collection.insertOne({
      pumpId: new ObjectId(session.pumpId),
      clientName,
      department,
      phone,
      username: normalizedUsername,
      password, // In production, hash this
      numberOfVehicles: numberOfVehicles ? parseInt(numberOfVehicles) : 1,
      vehicleTypes: Array.isArray(vehicleTypes) ? vehicleTypes : [],
      openingAmount: parseFloat(openingAmount || 0),
      date: date || new Date().toISOString().split("T")[0],
      petrolActualRate: parseFloat(petrolActualRate || 0),
      petrolGivenRate: parseFloat(petrolGivenRate || 0),
      dieselActualRate: parseFloat(dieselActualRate || 0),
      dieselGivenRate: parseFloat(dieselGivenRate || 0),
      totalFuelAmount: parseFloat(openingAmount || 0),
      totalPaid: 0,
      advancePaid: parseFloat(openingAmount || 0),
      remainingBalance: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      _id: result.insertedId.toString(),
      clientName,
      department,
      phone,
      username: normalizedUsername,
      password,
      numberOfVehicles: numberOfVehicles || 1,
      vehicleTypes: vehicleTypes || [],
      openingAmount: parseFloat(openingAmount || 0),
      date,
      petrolActualRate,
      petrolGivenRate,
      dieselActualRate,
      dieselGivenRate,
      totalFuelAmount: parseFloat(openingAmount || 0),
      totalPaid: 0,
      advancePaid: parseFloat(openingAmount || 0),
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
