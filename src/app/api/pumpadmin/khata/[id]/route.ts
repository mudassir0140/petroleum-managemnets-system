import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getSession();
    if (!session?.pumpId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { customerName, phone, amount, date, note } = body;

    if (!customerName || !phone || amount === undefined || !date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection("khata");

    const result = await collection.updateOne(
      {
        _id: new ObjectId(id),
        pumpId: new ObjectId(session.pumpId),
      },
      {
        $set: {
          customerName,
          phone,
          amount: parseFloat(amount),
          date: new Date(date).toISOString(),
          note: note || "",
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Khata entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      _id: id,
      customerName,
      phone,
      amount: parseFloat(amount),
      date: new Date(date).toISOString(),
      note: note || "",
    });
  } catch (error) {
    console.error("[Khata] PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update khata entry" },
      { status: 500 }
    );
  }
}

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
    const collection = db.collection("khata");

    const result = await collection.deleteOne({
      _id: new ObjectId(id),
      pumpId: new ObjectId(session.pumpId),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Khata entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Khata] DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete khata entry" },
      { status: 500 }
    );
  }
}
