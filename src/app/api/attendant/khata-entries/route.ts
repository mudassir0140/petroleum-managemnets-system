import { NextRequest, NextResponse } from "next/server";
import { getEmployeeSession } from "@/lib/employee/session";
import { getDatabase } from "@/lib/db/mongodb";
import { getCurrentFuelRates } from "@/lib/db/fuel-rates";
import { toObjectId } from "@/lib/khata/ids";
import { KHATA_NO_STORE_HEADERS } from "@/lib/khata/no-store";
import {
  calcKhataAmount,
  givenRateFor,
  normalizeFuelType,
  serializeKhataEntry,
  toSafeNumber,
} from "@/lib/khata/entry";
import { ObjectId } from "mongodb";

// Khata entries are live data shared by attendant, owner and client.
// Never serve them from a cache.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Saves one fuel entry to a khata account. The amount is computed here, on the
// server, as litres × the account's given rate, so the attendant, the owner and
// the client all read the same stored value.
export async function POST(request: NextRequest) {
  try {
    const session = await getEmployeeSession();
    if (!session || session.role !== "pump-attendant") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pumpId = toObjectId(session.pumpId);
    if (!pumpId) {
      return NextResponse.json(
        { error: "Your account is not linked to a pump" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { khataClientId, fuelType, litres, vehicleNumber, driverName } = body;
    // The rate typed on the entry form. Saved with this entry.
    const typedRate = toSafeNumber(body?.givenRate);

    const clientId = toObjectId(khataClientId);
    const fuel = normalizeFuelType(fuelType);
    const litresNum = toSafeNumber(litres);

    if (!clientId || !fuel || litresNum <= 0 || !vehicleNumber || !driverName) {
      return NextResponse.json(
        { error: "Missing or invalid fields" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const entriesCollection = db.collection("khataEntries");
    const clientsCollection = db.collection("khataClients");
    const monthsCollection = db.collection("khataMonths");

    // The khata account must belong to the attendant's own pump.
    const client = await clientsCollection.findOne({ _id: clientId, pumpId });
    if (!client) {
      return NextResponse.json(
        { error: "Khata client not found or unauthorized" },
        { status: 404 }
      );
    }

    // Use the rate typed for this entry; older callers without one use the account's stored rate.
    const givenRate = typedRate > 0 ? typedRate : givenRateFor(client, fuel);
    if (givenRate <= 0) {
      return NextResponse.json(
        { error: "Enter the rate for this entry" },
        { status: 400 }
      );
    }

    const amount = calcKhataAmount(litresNum, givenRate);

    const rates = await getCurrentFuelRates(pumpId);
    const actualRate = toSafeNumber(
      fuel === "Diesel" ? rates?.dieselRate : rates?.petrolRate
    );

    // Assign the entry to the open month, the same way the owner's entry route does.
    const currentMonth = await monthsCollection.findOne({
      khataClientId: clientId,
      pumpId,
      status: "open",
    });

    const now = new Date();
    const result = await entriesCollection.insertOne({
      pumpId,
      khataClientId: clientId,
      ...(currentMonth ? { khataMonthId: currentMonth._id } : {}),
      attendantId: toObjectId(session.employeeId) ?? String(session.employeeId),
      attendantName: session.name || "",
      fuelType: fuel,
      litres: litresNum,
      vehicleNumber: String(vehicleNumber).trim(),
      driverName: String(driverName).trim(),
      givenRate,
      actualRate,
      amount,
      actualAmount: calcKhataAmount(litresNum, actualRate),
      discount: calcKhataAmount(litresNum, actualRate - givenRate),
      date: now.toISOString(),
      createdAt: now,
      updatedAt: now,
    });

    await clientsCollection.updateOne(
      { _id: clientId, pumpId },
      {
        $inc: { totalFuelAmount: amount, remainingBalance: amount },
        $set: { updatedAt: now },
      }
    );

    if (currentMonth) {
      await monthsCollection.updateOne(
        { _id: currentMonth._id },
        { $inc: { totalFuel: amount } }
      );
    }

    // Read the record back so the response is exactly what was stored.
    const saved = await entriesCollection.findOne({ _id: result.insertedId });
    const [totals] = await entriesCollection
      .aggregate([
        { $match: { pumpId, khataClientId: clientId } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ])
      .toArray();

    return NextResponse.json(
      {
        success: true,
        entryId: result.insertedId.toString(),
        entry: serializeKhataEntry(saved),
        khataTotalAmount: Math.round(toSafeNumber(totals?.total) * 100) / 100,
      },
      { headers: KHATA_NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error("[KhataEntries] POST error:", error);
    return NextResponse.json(
      { error: "Failed to create khata entry" },
      { status: 500 }
    );
  }
}

// Lists entries from the attendant's own pump. With ?khataClientId= it returns
// that account's entries (used for its running total); without it, the pump's
// most recent entries.
export async function GET(request: NextRequest) {
  try {
    const session = await getEmployeeSession();
    if (!session || session.role !== "pump-attendant") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pumpId = toObjectId(session.pumpId);
    if (!pumpId) {
      return NextResponse.json(
        { error: "Your account is not linked to a pump" },
        { status: 403 }
      );
    }

    const khataParam = request.nextUrl.searchParams.get("khataClientId");
    const query: { pumpId: ObjectId; khataClientId?: ObjectId } = { pumpId };

    if (khataParam) {
      const clientId = toObjectId(khataParam);
      if (!clientId) {
        return NextResponse.json({ error: "Invalid khata client ID" }, { status: 400 });
      }
      query.khataClientId = clientId;
    }

    const db = await getDatabase();
    const entries = await db
      .collection("khataEntries")
      .find(query)
      .sort({ date: -1 })
      .limit(khataParam ? 500 : 100)
      .toArray();

    return NextResponse.json(entries.map(serializeKhataEntry), {
      headers: KHATA_NO_STORE_HEADERS,
    });
  } catch (error) {
    console.error("[KhataEntries] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch khata entries" },
      { status: 500 }
    );
  }
}
