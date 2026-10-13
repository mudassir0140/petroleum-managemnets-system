import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";
import { KHATA_NO_STORE_HEADERS } from "@/lib/khata/no-store";

// The client dashboard polls this route, so it must always read MongoDB.
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    const monthsCollection = db.collection("khataMonths");

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

    const months = await monthsCollection
      .find({ khataClientId: new ObjectId(session.khataClientId) })
      .sort({ month: -1 })
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
      months: months.map((m: any) => ({
        _id: m._id.toString(),
        month: m.month,
        openingBalance: m.openingBalance || 0,
        totalFuel: m.totalFuel || 0,
        paid: m.paid || 0,
        advance: m.advance || 0,
        remaining: m.remaining || 0,
        status: m.status || "open",
      })),
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
