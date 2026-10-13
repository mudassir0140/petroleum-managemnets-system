import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { KHATA_NO_STORE_HEADERS } from "@/lib/khata/no-store";

// Month totals are shown live on the owner's khata page, so never cache them.
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

    if (!khataClientId) {
      return NextResponse.json(
        { error: "Missing khata client ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection("khataMonths");

    const months = await collection
      .find({
        khataClientId: new ObjectId(khataClientId),
        pumpId: new ObjectId(session.pumpId),
      })
      .sort({ month: -1 })
      .toArray();

    return NextResponse.json(
      months.map((month: any) => ({
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
        createdAt: month.createdAt,
      })),
      { headers: KHATA_NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error("[Khata Months] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch khata months" },
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
    const { khataClientId } = body;

    if (!khataClientId) {
      return NextResponse.json(
        { error: "Missing khata client ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const monthsCollection = db.collection("khataMonths");

    // Get current month for this client
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Check if a month already exists for this period
    const existingMonth = await monthsCollection.findOne({
      khataClientId: new ObjectId(khataClientId),
      pumpId: new ObjectId(session.pumpId),
      month: currentMonth,
    });

    if (existingMonth) {
      return NextResponse.json(
        { error: "Month already exists for current period" },
        { status: 400 }
      );
    }

    // Get the previous month to carry forward balance
    const lastMonth = await monthsCollection
      .find({
        khataClientId: new ObjectId(khataClientId),
        pumpId: new ObjectId(session.pumpId),
      })
      .sort({ month: -1 })
      .limit(1)
      .toArray();

    let openingBalance = 0;
    if (lastMonth.length > 0) {
      // Close the last month
      await monthsCollection.updateOne(
        { _id: lastMonth[0]._id },
        { $set: { status: "closed" } }
      );
      // Carry forward remaining as opening balance
      openingBalance = lastMonth[0].remaining || 0;
    }

    const result = await monthsCollection.insertOne({
      khataClientId: new ObjectId(khataClientId),
      pumpId: new ObjectId(session.pumpId),
      month: currentMonth,
      openingBalance,
      totalFuel: 0,
      paid: 0,
      advance: 0,
      remaining: openingBalance,
      status: "open",
      createdAt: new Date(),
    });

    return NextResponse.json({
      _id: result.insertedId.toString(),
      khataClientId,
      pumpId: session.pumpId,
      month: currentMonth,
      openingBalance,
      totalFuel: 0,
      paid: 0,
      advance: 0,
      remaining: openingBalance,
      status: "open",
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("[Khata Months] POST error:", error);
    return NextResponse.json(
      { error: "Failed to create khata month" },
      { status: 500 }
    );
  }
}
