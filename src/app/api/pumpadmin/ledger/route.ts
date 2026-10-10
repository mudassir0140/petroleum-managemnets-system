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

    const db = await getDatabase();
    const ledgerCollection = db.collection("ledger");

    const entries = await ledgerCollection
      .find({
        $or: [
          { giverId: new ObjectId(session.pumpId) },
          { receiverId: new ObjectId(session.pumpId) },
        ],
      })
      .sort({ createdAt: -1 })
      .toArray();

    const gave = entries
      .filter((e) => e.giverId.toString() === session.pumpId)
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    const received = entries
      .filter((e) => e.receiverId.toString() === session.pumpId)
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    const balance = gave - received;

    return NextResponse.json({
      entries: entries.map((e) => ({
        _id: e._id.toString(),
        giverId: e.giverId.toString(),
        giverName: e.giverName,
        receiverId: e.receiverId.toString(),
        receiverName: e.receiverName,
        fuelType: e.fuelType,
        litres: e.litres,
        rate: e.rate,
        amount: e.amount,
        createdAt: e.createdAt,
      })),
      summary: {
        gave,
        received,
        balance,
      },
    });
  } catch (error) {
    console.error("[Ledger] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch ledger" },
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
    const { action, receiverId, fuelType, litres, rate, note } = body;

    if (action === "record") {
      if (!["petrol", "diesel"].includes(fuelType)) {
        return NextResponse.json(
          { error: "Invalid fuel type" },
          { status: 400 }
        );
      }

      const db = await getDatabase();
      const ledgerCollection = db.collection("ledger");
      const pumpsCollection = db.collection("pumps");

      const giverPump = await pumpsCollection.findOne({
        _id: new ObjectId(session.pumpId),
      });
      const receiverPump = await pumpsCollection.findOne({
        _id: new ObjectId(receiverId),
      });

      if (!receiverPump) {
        return NextResponse.json(
          { error: "Receiver pump not found" },
          { status: 404 }
        );
      }

      const amount = parseFloat(litres) * parseFloat(rate);

      await ledgerCollection.insertOne({
        giverId: new ObjectId(session.pumpId),
        giverName: giverPump?.name || "Unknown",
        receiverId: new ObjectId(receiverId),
        receiverName: receiverPump.name || "Unknown",
        fuelType,
        litres: parseFloat(litres),
        rate: parseFloat(rate),
        amount,
        note: note || "",
        createdAt: new Date(),
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[Ledger] POST error:", error);
    return NextResponse.json(
      { error: "Failed to record ledger entry" },
      { status: 500 }
    );
  }
}
