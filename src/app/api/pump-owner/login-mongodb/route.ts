import { NextRequest, NextResponse } from "next/server";
import { getPumpByEmail } from "@/lib/db/pump-service";
import { cookies } from "next/headers";
import { verifyPassword } from "@/lib/auth/password";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    // Find pump by owner email in MongoDB
    const pump = await getPumpByEmail(email);
    if (!pump) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!pump.ownerPasswordHash || !verifyPassword(password, pump.ownerPasswordHash)) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (pump.accountStatus === "inactive") {
      return NextResponse.json(
        { error: "This account has been deactivated. Contact your administrator." },
        { status: 403 }
      );
    }

    // Check if pump is online (not in maintenance or offline)
    if (pump.status === "Offline" || pump.status === "Maintenance") {
      return NextResponse.json(
        { error: `Pump is currently ${pump.status}. Cannot login at this time.` },
        { status: 403 }
      );
    }

    // Set secure session cookie
    const cookieStore = await cookies();
    cookieStore.set("pump_owner_session", JSON.stringify({
      pumpId: pump._id?.toString(),
      email: pump.ownerEmail,
      name: pump.name,
      ownerName: pump.ownerName,
      role: "pump-owner",
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });

    return NextResponse.json({
      success: true,
      pump: {
        _id: pump._id,
        name: pump.name,
        ownerName: pump.ownerName,
        ownerEmail: pump.ownerEmail,
        status: pump.status,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[PumpOwnerLogin] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
