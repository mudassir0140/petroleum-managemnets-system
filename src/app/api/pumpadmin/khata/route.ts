import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.pumpId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    const collection = db.collection("khata");
    const entries = await collection
      .find({ pumpId: new ObjectId(session.pumpId) })
      .sort({ date: -1 })
      .toArray();

    return NextResponse.json(entries.map((entry: any) => ({
      _id: entry._id.toString(),
      customerName: entry.customerName,
      phone: entry.phone,
      amount: entry.amount,
      date: entry.date,
      note: entry.note,
      createdAt: entry.createdAt,
    })));
  } catch (error) {
    console.error("[Khata] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch khata entries" },
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
    const { customerName, phone, amount, date, note } = body;

    if (!customerName || !phone || amount === undefined || !date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection("khata");

    const result = await collection.insertOne({
      pumpId: new ObjectId(session.pumpId),
      customerName,
      phone,
      amount: parseFloat(amount),
      date: new Date(date).toISOString(),
      note: note || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      _id: result.insertedId.toString(),
      customerName,
      phone,
      amount: parseFloat(amount),
      date: new Date(date).toISOString(),
      note: note || "",
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("[Khata] POST error:", error);
    return NextResponse.json(
      { error: "Failed to create khata entry" },
      { status: 500 }
    );
  }
}
