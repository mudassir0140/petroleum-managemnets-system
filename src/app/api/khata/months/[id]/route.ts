import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
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
    const monthsCollection = db.collection("khataMonths");
    const entriesCollection = db.collection("khataEntries");
    const paymentsCollection = db.collection("khataPayments");

    const month = await monthsCollection.findOne({
      _id: new ObjectId(id),
      pumpId: new ObjectId(session.pumpId),
    });

    if (!month) {
      return NextResponse.json(
        { error: "Month not found" },
        { status: 404 }
      );
    }

    // Get entries and payments for this month
    const entries = await entriesCollection
      .find({
        khataMonthId: new ObjectId(id),
        pumpId: new ObjectId(session.pumpId),
      })
      .sort({ date: -1 })
      .toArray();

    const payments = await paymentsCollection
      .find({
        khataMonthId: new ObjectId(id),
        pumpId: new ObjectId(session.pumpId),
      })
      .sort({ date: -1 })
      .toArray();

    return NextResponse.json({
      _id: month._id.toString(),
      khataClientId: month.khataClientId.toString(),
      pumpId: month.pumpId.toString(),
      month: month.month,
      openingBalance: month.openingBalance || 0,
      totalFuel: month.totalFuel || 0,
      paid: month.paid || 0,
      advance: month.advance || 0,
      remaining: month.remaining || 0,
      status: month.status || "open",
      entries: entries.map((e: any) => ({
        _id: e._id.toString(),
        fuelType: e.fuelType,
        litres: e.litres || 0,
        vehicleNumber: e.vehicleNumber,
        driverName: e.driverName,
        amount: e.amount || 0,
        givenRate: e.givenRate || 0,
        date: e.date,
        attendantName: e.attendantName,
      })),
      payments: payments.map((p: any) => ({
        _id: p._id.toString(),
        amountReceived: p.amountReceived || 0,
        advancePaid: p.advancePaid || 0,
        date: p.date,
        note: p.note,
      })),
      createdAt: month.createdAt,
    });
  } catch (error) {
    console.error("[Khata Months] GET [id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch khata month" },
      { status: 500 }
    );
  }
}

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
    const { totalFuel, paid, advance } = body;

    const db = await getDatabase();
    const monthsCollection = db.collection("khataMonths");
    const editsCollection = db.collection("khataMonthEdits");

    // Get current month data
    const month = await monthsCollection.findOne({
      _id: new ObjectId(id),
      pumpId: new ObjectId(session.pumpId),
    });

    if (!month) {
      return NextResponse.json(
        { error: "Month not found" },
        { status: 404 }
      );
    }

    // Calculate remaining: (opening balance + total fuel) - paid - advance
    const totalFuelValue = (totalFuel ?? (month.totalFuel || 0));
    const paidValue = (paid ?? (month.paid || 0));
    const advanceValue = (advance ?? (month.advance || 0));
    const monthEndTotal = (month.openingBalance || 0) + totalFuelValue;
    const remaining = Math.max(0, monthEndTotal - paidValue - advanceValue);

    // Create edit logs for changes
    if (totalFuel !== undefined && totalFuel !== month.totalFuel) {
      await editsCollection.insertOne({
        khataMonthId: new ObjectId(id),
        field: "totalFuel",
        oldValue: month.totalFuel || 0,
        newValue: totalFuel,
        editedBy: session.ownerName || "system",
        editedAt: new Date(),
      });
    }

    if (paid !== undefined && paid !== month.paid) {
      await editsCollection.insertOne({
        khataMonthId: new ObjectId(id),
        field: "paid",
        oldValue: month.paid || 0,
        newValue: paid,
        editedBy: session.ownerName || "system",
        editedAt: new Date(),
      });
    }

    if (advance !== undefined && advance !== month.advance) {
      await editsCollection.insertOne({
        khataMonthId: new ObjectId(id),
        field: "advance",
        oldValue: month.advance || 0,
        newValue: advance,
        editedBy: session.ownerName || "system",
        editedAt: new Date(),
      });
    }

    // Update month
    const result = await monthsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          totalFuel: totalFuelValue,
          paid: paidValue,
          advance: advanceValue,
          remaining,
        },
      }
    );

    return NextResponse.json({
      _id: month._id.toString(),
      khataClientId: month.khataClientId.toString(),
      pumpId: month.pumpId.toString(),
      month: month.month,
      openingBalance: month.openingBalance || 0,
      totalFuel: totalFuelValue,
      paid: paidValue,
      advance: advanceValue,
      remaining,
      status: month.status,
      createdAt: month.createdAt,
    });
  } catch (error) {
    console.error("[Khata Months] PUT [id] error:", error);
    return NextResponse.json(
      { error: "Failed to update khata month" },
      { status: 500 }
    );
  }
}
