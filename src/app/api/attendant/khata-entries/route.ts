import { NextRequest, NextResponse } from "next/server";
import { getEmployeeSession } from "@/lib/employee/session";
import { getDatabase } from "@/lib/db/mongodb";
import { getCurrentFuelRates } from "@/lib/db/fuel-rates";
import { toObjectId } from "@/lib/khata/ids";
import { attendantAccountQuery } from "@/lib/khata/access";
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

    // The khata account must be assigned to this attendant, on their own pump.
    const attendantId = toObjectId(session.employeeId);
    if (!attendantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const client = await clientsCollection.findOne({
      _id: clientId,
      ...attendantAccountQuery(pumpId, attendantId),
    });
    if (!client) {
      return NextResponse.json(
        { error: "Khata client not found or unauthorized" },
        { status: 404 }
      );
    }

    const givenRate = givenRateFor(client, fuel);
    if (givenRate <= 0) {
      return NextResponse.json(
        { error: "No given rate is set for this khata account" },
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

// Lists entries for the khata accounts assigned to this attendant. With
// ?khataClientId= it returns that account's entries (used for its running
// total); without it, every assigned account's entries, newest first.
// Each entry carries its account name and a status: "Closed" once its month
// is closed, otherwise "Open".
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

    const attendantId = toObjectId(session.employeeId);
    if (!attendantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();

    // Only accounts assigned to this attendant can contribute entries.
    const accounts = await db
      .collection("khataClients")
      .find(attendantAccountQuery(pumpId, attendantId), { projection: { clientName: 1 } })
      .toArray();
    const accountIds = accounts.map((account) => account._id);
    const accountNames = new Map(
      accounts.map((account) => [String(account._id), account.clientName || ""])
    );

    const khataParam = request.nextUrl.searchParams.get("khataClientId");
    const query: { pumpId: ObjectId; khataClientId: ObjectId | { $in: ObjectId[] } } = {
      pumpId,
      khataClientId: { $in: accountIds },
    };

    if (khataParam) {
      const clientId = toObjectId(khataParam);
      if (!clientId) {
        return NextResponse.json({ error: "Invalid khata client ID" }, { status: 400 });
      }
      if (!accountNames.has(clientId.toHexString())) {
        return NextResponse.json(
          { error: "Khata client not found or unauthorized" },
          { status: 404 }
        );
      }
      query.khataClientId = clientId;
    }

    const entries = await db
      .collection("khataEntries")
      .find(query)
      .sort({ date: -1 })
      .limit(500)
      .toArray();

    // Entry status comes from its khata month: a closed month makes its entries Closed.
    const monthIds = entries
      .map((entry) => entry.khataMonthId)
      .filter((id) => id);
    const months = monthIds.length
      ? await db
          .collection("khataMonths")
          .find({ _id: { $in: monthIds } }, { projection: { status: 1 } })
          .toArray()
      : [];
    const closedMonthIds = new Set(
      months.filter((month) => month.status === "closed").map((month) => String(month._id))
    );

    return NextResponse.json(
      entries.map((entry) => ({
        ...serializeKhataEntry(entry),
        clientName: accountNames.get(String(entry.khataClientId)) || "",
        status: entry.khataMonthId && closedMonthIds.has(String(entry.khataMonthId)) ? "Closed" : "Open",
      })),
      { headers: KHATA_NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error("[KhataEntries] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch khata entries" },
      { status: 500 }
    );
  }
}
