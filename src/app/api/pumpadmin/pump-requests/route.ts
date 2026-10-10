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
    const requestsCollection = db.collection("pump_friend_requests");
    const pumpsCollection = db.collection("pumps");

    const receivedRequests = await requestsCollection
      .find({ receiverId: new ObjectId(session.pumpId), status: "pending" })
      .toArray();

    const sentRequests = await requestsCollection
      .find({ senderId: new ObjectId(session.pumpId) })
      .toArray();

    const connectedPumps = await pumpsCollection
      .find({
        _id: {
          $in: (await requestsCollection
            .find({
              $or: [
                { senderId: new ObjectId(session.pumpId), status: "accepted" },
                { receiverId: new ObjectId(session.pumpId), status: "accepted" },
              ],
            })
            .toArray())
            .map((r) =>
              r.senderId.toString() === session.pumpId
                ? r.receiverId
                : r.senderId
            ),
        },
      })
      .toArray();

    return NextResponse.json({
      received: receivedRequests.map((r) => ({
        _id: r._id.toString(),
        senderId: r.senderId.toString(),
        senderName: r.senderName,
        status: r.status,
        createdAt: r.createdAt,
      })),
      sent: sentRequests.map((r) => ({
        _id: r._id.toString(),
        receiverId: r.receiverId.toString(),
        receiverName: r.receiverName,
        status: r.status,
        createdAt: r.createdAt,
      })),
      connected: connectedPumps.map((p) => ({
        _id: p._id.toString(),
        name: p.name || "Unknown",
      })),
    });
  } catch (error) {
    console.error("[PumpRequests] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pump requests" },
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
    const { action, receiverId, requestId, status } = body;

    const db = await getDatabase();
    const requestsCollection = db.collection("pump_friend_requests");
    const pumpsCollection = db.collection("pumps");

    if (action === "send") {
      const receiverPump = await pumpsCollection.findOne({
        _id: new ObjectId(receiverId),
      });

      if (!receiverPump) {
        return NextResponse.json(
          { error: "Pump not found" },
          { status: 404 }
        );
      }

      const senderPump = await pumpsCollection.findOne({
        _id: new ObjectId(session.pumpId),
      });

      await requestsCollection.insertOne({
        senderId: new ObjectId(session.pumpId),
        senderName: senderPump?.name || "Unknown",
        receiverId: new ObjectId(receiverId),
        receiverName: receiverPump.name || "Unknown",
        status: "pending",
        createdAt: new Date(),
      });

      return NextResponse.json({ success: true });
    }

    if (action === "respond") {
      if (!["accepted", "rejected"].includes(status)) {
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
    console.error("[PumpRequests] POST error:", error);
    return NextResponse.json(
      { error: "Failed to process pump request" },
      { status: 500 }
    );
  }
}
