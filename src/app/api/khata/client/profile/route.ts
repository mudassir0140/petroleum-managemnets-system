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
    const updatesCollection = db.collection("khataUpdates");

    const entries = await entriesCollection
      .find({ khataClientId: new ObjectId(session.khataClientId) })
      .sort({ date: -1 })
      .toArray();

    const payments = await paymentsCollection
      .find({ khataClientId: new ObjectId(session.khataClientId) })
      .sort({ date: -1 })
      .toArray();

    const updates = await updatesCollection
      .find({ khataClientId: new ObjectId(session.khataClientId) })
      .toArray();

    // Calculate totals from entries and updates
    const totalFuelAmount = entries.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalPaid = updates
      .filter((u) => u.type === "amountPaid")
      .reduce((sum, u) => sum + (u.amount || 0), 0);
    const advancePaid = updates
      .filter((u) => u.type === "advance")
      .reduce((sum, u) => sum + (u.amount || 0), 0);
    const remainingBalance = Math.max(0, totalFuelAmount - totalPaid);

    return NextResponse.json({
      _id: client._id.toString(),
      clientName: client.clientName,
      department: client.department,
      numberOfVehicles: client.numberOfVehicles,
      vehicleTypes: client.vehicleTypes,
      totalFuelAmount: totalFuelAmount || 0,
      totalPaid: totalPaid || 0,
      advancePaid: advancePaid || 0,
      remainingBalance: remainingBalance || 0,
      entries: entries.map((e: any) => ({
        _id: e._id.toString(),
        fuelType: e.fuelType,
        litres: e.litres || 0,
        vehicleNumber: e.vehicleNumber,
        driverName: e.driverName,
        amount: e.amount || 0,
        givenRate: e.givenRate || 0,
        date: e.date,
        attendantName: e.attendantName,
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
