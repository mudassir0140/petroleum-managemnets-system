import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

export async function DELETE(
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
    const clientId = new ObjectId(id);
    const pumpId = new ObjectId(session.pumpId);

    const result = await db.collection("khataClients").deleteOne({
      _id: clientId,
      pumpId: pumpId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Khata not found" }, { status: 404 });
    }

    // Delete all entries for this khata
    await db.collection("khataEntries").deleteMany({
      khataClientId: clientId,
      pumpId: pumpId,
    });

    // Delete all payments for this khata
    await db.collection("khataPayments").deleteMany({
      khataClientId: clientId,
      pumpId: pumpId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Khata Delete] error:", error);
    return NextResponse.json(
      { error: "Failed to delete khata" },
      { status: 500 }
    );
  }
}
