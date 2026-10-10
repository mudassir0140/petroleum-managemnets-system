import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

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
    const clientsCollection = db.collection("khataClients");
    const entriesCollection = db.collection("khataEntries");
    const paymentsCollection = db.collection("khataPayments");

    const client = await clientsCollection.findOne({
      _id: new ObjectId(id),
      pumpId: new ObjectId(session.pumpId),
    });

    if (!client) {
      return NextResponse.json(
        { error: "Khata client not found" },
        { status: 404 }
      );
    }

    const entries = await entriesCollection
      .find({ khataClientId: new ObjectId(id) })
      .sort({ date: -1 })
      .toArray();

    const payments = await paymentsCollection
      .find({ khataClientId: new ObjectId(id) })
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
    console.error("[Khata Clients] GET [id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch khata client" },
      { status: 500 }
    );
  }
}
