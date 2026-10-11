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
    const updatesCollection = db.collection("khataUpdates");

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

    const updates = await updatesCollection
      .find({ khataClientId: new ObjectId(id) })
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
      phone: client.phone || "",
      username: client.username || "",
      password: client.password || "",
      petrolGivenRate: client.petrolGivenRate || 0,
      dieselGivenRate: client.dieselGivenRate || 0,
      totalFuelAmount: totalFuelAmount || 0,
      totalPaid: totalPaid || 0,
      advancePaid: advancePaid || 0,
      remainingBalance: remainingBalance || 0,
    });
  } catch (error) {
    console.error("[Khata Clients] GET [id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch khata client" },
      { status: 500 }
    );
  }
}
