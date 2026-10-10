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
    const requestsCollection = db.collection("fuel_requests");

    const received = await requestsCollection
      .find({ receiverId: new ObjectId(session.pumpId) })
      .sort({ createdAt: -1 })
      .toArray();

    const sent = await requestsCollection
      .find({ senderId: new ObjectId(session.pumpId) })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      received: received.map((r) => ({
        _id: r._id.toString(),
        senderId: r.senderId.toString(),
        senderName: r.senderName,
        fuelType: r.fuelType,
        litres: r.litres,
        note: r.note,
        status: r.status,
        createdAt: r.createdAt,
      })),
      sent: sent.map((r) => ({
        _id: r._id.toString(),
        receiverId: r.receiverId.toString(),
        receiverName: r.receiverName,
        fuelType: r.fuelType,
        litres: r.litres,
        note: r.note,
        status: r.status,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error("[FuelRequests] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch fuel requests" },
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
    const { action, fuelType, litres, note, receiverId, requestId, status } = body;

    const db = await getDatabase();
    const requestsCollection = db.collection("fuel_requests");
    const pumpsCollection = db.collection("pumps");

    if (action === "send") {
      if (!["petrol", "diesel"].includes(fuelType)) {
        return NextResponse.json(
          { error: "Invalid fuel type" },
          { status: 400 }
        );
      }

      const senderPump = await pumpsCollection.findOne({
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

      await requestsCollection.insertOne({
        senderId: new ObjectId(session.pumpId),
        senderName: senderPump?.name || "Unknown",
        receiverId: new ObjectId(receiverId),
        receiverName: receiverPump.name || "Unknown",
        fuelType,
        litres: parseFloat(litres),
        note: note || "",
        status: "sent",
        createdAt: new Date(),
      });

      return NextResponse.json({ success: true });
    }

    if (action === "respond") {
      if (!["seen", "accepted", "rejected"].includes(status)) {
        return NextResponse.json(
          { error: "Invalid status" },
          { status: 400 }
        );
      }

      await requestsCollection.updateOne(
        { _id: new ObjectId(requestId) },
        { $set: { status, updatedAt: new Date() } }
      );

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[FuelRequests] POST error:", error);
    return NextResponse.json(
      { error: "Failed to process fuel request" },
      { status: 500 }
    );
  }
}
