import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("khata_client_session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie);
    const db = await getDatabase();

    const clientsCollection = db.collection("khataClients");
    const client = await clientsCollection.findOne({
      _id: new ObjectId(session.khataClientId),
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    const entriesCollection = db.collection("khataEntries");
    const paymentsCollection = db.collection("khataPayments");

    const entries = await entriesCollection
      .find({ khataClientId: new ObjectId(session.khataClientId) })
      .sort({ date: -1 })
      .toArray();

    const payments = await paymentsCollection
      .find({ khataClientId: new ObjectId(session.khataClientId) })
      .sort({ date: -1 })
      .toArray();

    return NextResponse.json({
      _id: client._id.toString(),
      clientName: client.clientName,
      department: client.department,
      numberOfVehicles: client.numberOfVehicles,
      vehicleTypes: client.vehicleTypes,
      totalFuelAmount: client.totalFuelAmount,
      totalPaid: client.totalPaid,
      advancePaid: client.advancePaid,
      remainingBalance: client.remainingBalance,
      entries: entries.map((e: any) => ({
        _id: e._id.toString(),
        fuelType: e.fuelType,
        litres: e.litres,
        vehicleNumber: e.vehicleNumber,
        driverName: e.driverName,
        amount: e.amount,
        date: e.date,
      })),
      payments: payments.map((p: any) => ({
        _id: p._id.toString(),
        amountReceived: p.amountReceived,
        advancePaid: p.advancePaid,
        date: p.date,
        note: p.note,
      })),
    });
  } catch (error) {
    console.error("[Khata Profile] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
