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

    const { searchParams } = new URL(request.url);
    const khataClientId = searchParams.get("khataClientId");

    const db = await getDatabase();
    const collection = db.collection("khataPayments");

    const query: any = { pumpId: new ObjectId(session.pumpId) };
    if (khataClientId) {
      query.khataClientId = new ObjectId(khataClientId);
    }

    const payments = await collection
      .find(query)
      .sort({ date: -1 })
      .toArray();

    return NextResponse.json(
      payments.map((payment: any) => ({
        _id: payment._id.toString(),
        khataClientId: payment.khataClientId.toString(),
        amountReceived: payment.amountReceived,
        advancePaid: payment.advancePaid,
        date: payment.date,
        note: payment.note,
        createdAt: payment.createdAt,
      }))
    );
  } catch (error) {
    console.error("[Khata Payments] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch khata payments" },
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
    const {
      khataClientId,
      amountReceived,
      advancePaid,
      note,
    } = body;

    if (!khataClientId) {
      return NextResponse.json(
        { error: "Missing khata client ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const paymentsCollection = db.collection("khataPayments");
    const clientsCollection = db.collection("khataClients");

    const result = await paymentsCollection.insertOne({
      pumpId: new ObjectId(session.pumpId),
      khataClientId: new ObjectId(khataClientId),
      amountReceived: parseFloat(amountReceived || 0),
      advancePaid: parseFloat(advancePaid || 0),
      date: new Date().toISOString(),
      note: note || "",
      createdAt: new Date(),
    });

    // Update khata client balance
    const totalPayment = parseFloat(amountReceived || 0) + parseFloat(advancePaid || 0);
    await clientsCollection.updateOne(
      { _id: new ObjectId(khataClientId) },
      {
        $inc: {
          totalPaid: parseFloat(amountReceived || 0),
          advancePaid: parseFloat(advancePaid || 0),
          remainingBalance: -totalPayment,
        },
      }
    );

    return NextResponse.json({
      _id: result.insertedId.toString(),
      khataClientId,
      amountReceived: parseFloat(amountReceived || 0),
      advancePaid: parseFloat(advancePaid || 0),
      date: new Date().toISOString(),
      note,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("[Khata Payments] POST error:", error);
    return NextResponse.json(
      { error: "Failed to create khata payment" },
      { status: 500 }
    );
  }
}
