import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { KHATA_NO_STORE_HEADERS } from "@/lib/khata/no-store";

// Payments feed the live owner and client khata views, so never cache them.
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
      })),
      { headers: KHATA_NO_STORE_HEADERS }
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
    const monthsCollection = db.collection("khataMonths");

    // Get the current open month for this client
    const currentMonth = await monthsCollection.findOne({
      khataClientId: new ObjectId(khataClientId),
      pumpId: new ObjectId(session.pumpId),
      status: "open",
    });

    const paymentData: any = {
      pumpId: new ObjectId(session.pumpId),
      khataClientId: new ObjectId(khataClientId),
      amountReceived: parseFloat(amountReceived || 0),
      advancePaid: parseFloat(advancePaid || 0),
      date: new Date().toISOString(),
      note: note || "",
      createdAt: new Date(),
    };

    // If there's a current month, assign payment to it
    if (currentMonth) {
      paymentData.khataMonthId = currentMonth._id;
    }

    const result = await paymentsCollection.insertOne(paymentData);

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

    // Update current month paid and advance if it exists
    if (currentMonth) {
      await monthsCollection.updateOne(
        { _id: currentMonth._id },
        {
          $inc: {
            paid: parseFloat(amountReceived || 0),
            advance: parseFloat(advancePaid || 0),
          },
        }
      );
    }

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
