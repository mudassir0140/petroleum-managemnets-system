import { NextRequest, NextResponse } from "next/server";
import { getEmployeeSession } from "@/lib/employee/session";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const session = await getEmployeeSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pumpId = request.nextUrl.searchParams.get("pumpId");

    const db = await getDatabase();
    const khataCollection = db.collection("khata_accounts");

    // Role-based access
    let query: any = {};

    if (session.role === "pump-attendant") {
      // Attendants see only their pump's khata accounts
      if (!session.pumpId) {
        return NextResponse.json({ error: "Pump ID required" }, { status: 400 });
      }
      query = { pumpId: new ObjectId(session.pumpId) };
    } else if (session.role === "pump-owner") {
      // Pump owners see their pump's khata accounts
      if (!session.pumpId) {
        return NextResponse.json({ error: "Pump ID required" }, { status: 400 });
      }
      query = { pumpId: new ObjectId(session.pumpId) };
    } else if (session.role === "company-owner" || session.role === "hr-manager") {
      // Admin/HR can see all khata accounts
      if (pumpId) {
        query = { pumpId: new ObjectId(pumpId) };
      }
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accounts = await khataCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(
      accounts.map((account: any) => ({
        _id: account._id.toString(),
        clientName: account.clientName,
        department: account.department,
        vehicleCount: account.vehicleCount || 0,
        vehicleType: account.vehicleType || "Car",
        pumpId: account.pumpId.toString(),
        createdBy: account.createdBy,
        createdAt: account.createdAt,
      }))
    );
  } catch (error) {
    console.error("[KhataAccounts] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch khata accounts" },
      { status: 500 }
    );
  }
}
