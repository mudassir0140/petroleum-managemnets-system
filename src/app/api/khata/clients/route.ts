import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId, type Document } from "mongodb";
import crypto from "crypto";
import { KHATA_NO_STORE_HEADERS } from "@/lib/khata/no-store";
import { loadAccountLedgers } from "@/lib/khata/monthly";
import { khataOwner } from "@/lib/khata/api-session";
import { isMonthKey, monthKeyOf } from "@/lib/khata/ledger";

// The owner's khata list refreshes live, so it must always read MongoDB.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const owner = await khataOwner();
    if (!owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const pumpId = owner.pumpId;
    const requested = new URL(request.url).searchParams.get("month");
    const selected = isMonthKey(requested) ? requested : monthKeyOf(now);

    const db = await getDatabase();
    const clients = await db.collection("khataClients").find({ pumpId }).sort({ createdAt: -1 }).toArray();
    const ledgers = new Map((await loadAccountLedgers(pumpId, now)).map((l) => [l.clientId, l]));

    return NextResponse.json(
      clients.map((client: Document) => {
        const id = String(client._id);
        const ledger = ledgers.get(id);
        const row = ledger?.rows.find((r) => r.month === selected);
        const safe: Document = { ...client };
        delete safe.password;
        return {
          ...safe,
          _id: id,
          petrolGivenRate: client.petrolGivenRate ?? 0,
          dieselGivenRate: client.dieselGivenRate ?? 0,
          petrolActualRate: client.petrolActualRate ?? 0,
          dieselActualRate: client.dieselActualRate ?? 0,
          // Computed from the dated records, so they always agree with the monthly history.
          totalFuelAmount: ledger?.totalFuel ?? 0,
          totalPaid: ledger?.totalPaid ?? 0,
          advancePaid: ledger?.totalAdvances ?? 0,
          remainingBalance: ledger?.balance ?? 0,
          monthly: row
            ? { month: selected, opening: row.opening, fuel: row.fuel, payments: row.payments, advances: row.advances, closing: row.closing, status: row.status, closed: row.closed }
            : { month: selected, opening: 0, fuel: 0, payments: 0, advances: 0, closing: 0, status: "pending", closed: false },
        };
      }),
      { headers: KHATA_NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error("[Khata Clients] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch khata clients" }, { status: 500 });
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
      advancePaid: 0,
      remainingBalance: parseFloat(openingAmount || 0),
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
      advancePaid: 0,
      remainingBalance: parseFloat(openingAmount || 0),
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
