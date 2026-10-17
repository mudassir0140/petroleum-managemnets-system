import { NextRequest, NextResponse } from "next/server";
import { getPumpByEmail } from "@/lib/db/pump-service";
import { cookies } from "next/headers";
import { verifyPassword } from "@/lib/auth/password";
import { isPumpOwnerRole, normalizeOwnerEmail } from "@/lib/auth/owner-credentials";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // The same normalisation the create route uses, so the stored and the typed email compare equal.
    const email = normalizeOwnerEmail(body?.email);
    const password = typeof body?.password === "string" ? body.password : "";

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

    if (!isPumpOwnerRole(pump.role)) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
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
      path: "/",
    });

    return NextResponse.json({
      success: true,
      role: "pump-owner",
      redirectUrl: "/pumpadmin",
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
