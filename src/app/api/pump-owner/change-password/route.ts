import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, updateUser } from "@/lib/db/users";
import { getPumpByEmail, updatePump } from "@/lib/db/pumps";
import { initializeDatabase } from "@/lib/db/init";

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();

    const body = await request.json();
    const { email, currentPassword, newPassword } = body;

    if (!email || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (user.passwordHash !== currentPassword) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    await updateUser(email, {
      passwordHash: newPassword,
    });

    const pump = await getPumpByEmail(email);
    if (pump) {
      await updatePump(pump.pumpId, {
        password: newPassword,
        updatedAt: new Date(),
      });
    }

    return NextResponse.json(
      { success: true, message: "Password changed successfully" },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[API] Change password error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
