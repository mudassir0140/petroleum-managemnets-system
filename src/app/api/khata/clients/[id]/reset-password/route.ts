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

    // Generate a new random password
    const newPassword = crypto.randomBytes(6).toString("hex").slice(0, 8);

    // Update the password
    const result = await clientsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          password: newPassword,
          updatedAt: new Date(),
        },
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to reset password" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      _id: id,
      username: client.username,
      password: newPassword,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("[Khata Password Reset] error:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
