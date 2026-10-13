import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import crypto from "crypto";
import { hashPassword } from "@/lib/auth/password";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Pump Owner resets an employee's password. The new password is shown once to
// the owner, stored as a hash, and kept as the visible copy, and the
// "changed by user" flag is cleared.
export async function POST(
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
    const collection = db.collection("pump_employees");
    const pumpId = new ObjectId(session.pumpId);
    const employeeId = new ObjectId(id);

    const employee = await collection.findOne({ _id: employeeId, pumpId });
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const newPassword = crypto.randomBytes(6).toString("hex").slice(0, 8);

    await collection.updateOne(
      { _id: employeeId, pumpId },
      {
        $set: {
          passwordHash: hashPassword(newPassword),
          password: newPassword,
          updatedAt: new Date(),
        },
        $unset: { passwordChangedByUser: "" },
      }
    );

    return NextResponse.json({
      _id: id,
      username: employee.username,
      password: newPassword,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("[PumpAdminEmployees] reset-password error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
