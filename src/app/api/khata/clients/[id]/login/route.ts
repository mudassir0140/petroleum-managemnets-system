import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import crypto from "crypto";

export async function POST(
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

    // If login already exists, return it
    if (client.username && client.password) {
      return NextResponse.json({
        _id: client._id.toString(),
        username: client.username,
        password: client.password,
      });
    }

    // Generate username from client name + pump name
    const pumpDoc = await db.collection("pumps").findOne({
      _id: new ObjectId(session.pumpId),
    });
    const pumpName = pumpDoc?.name || "Pump";

    const baseUsername = `${client.clientName}-${pumpName}`
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    // Generate a random password (6-8 character alphanumeric)
    const randomPassword = crypto.randomBytes(6).toString("hex").slice(0, 8);

    // Check if username exists, if so add a number
    let username = baseUsername;
    let counter = 1;
    while (true) {
      const existing = await clientsCollection.findOne({
        username: username.toLowerCase(),
      });
      if (!existing) break;
      username = `${baseUsername}-${counter}`;
      counter++;
    }

    // Update the client with credentials
    const result = await clientsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          username: username.toLowerCase(),
          password: randomPassword,
          updatedAt: new Date(),
        },
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to create login" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      _id: id,
      username: username.toLowerCase(),
      password: randomPassword,
    });
  } catch (error) {
    console.error("[Khata Login Create] error:", error);
    return NextResponse.json(
      { error: "Failed to create login" },
      { status: 500 }
    );
  }
}
