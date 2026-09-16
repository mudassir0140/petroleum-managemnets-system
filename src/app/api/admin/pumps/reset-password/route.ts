import { NextRequest, NextResponse } from "next/server";
import { getPumpById, updatePump } from "@/lib/db/pumps";
import { getUserByEmail, updateUser } from "@/lib/db/users";
import { initializeDatabase } from "@/lib/db/init";

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();

    const body = await request.json();
    const { pumpId } = body;

    if (!pumpId) {
      return NextResponse.json(
        { error: "pumpId is required" },
        { status: 400 }
      );
    }

    const pump = await getPumpById(pumpId);
    if (!pump) {
      return NextResponse.json(
        { error: "Pump not found" },
        { status: 404 }
      );
    }

    const newPassword = `${pump.ownerName}123`;

    const user = await getUserByEmail(pump.ownerEmail);
    if (!user) {
      return NextResponse.json(
        { error: "User account not found" },
        { status: 404 }
      );
    }

    await updateUser(pump.ownerEmail, {
      passwordHash: newPassword,
    });

    await updatePump(pumpId, {
      password: newPassword,
      updatedAt: new Date(),
    });

    return NextResponse.json(
      { success: true, password: newPassword, message: "Password reset successfully" },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[API] Password reset error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
