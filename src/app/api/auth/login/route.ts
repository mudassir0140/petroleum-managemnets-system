import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPumpByEmail } from "@/lib/db/pump-service";
import { verifyPassword } from "@/lib/auth/password";

// Single source of truth: the `pumps` collection. The Admin's create-pump
// route (/api/admin/pumps-mongodb) writes ownerEmail / ownerPasswordHash /
// role on that same document, so deleting the pump removes the login too.
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    console.log("[LoginAPI] Login attempt:", { email: email?.toLowerCase(), passwordLength: password?.length });

    if (!email || !password) {
      console.log("[LoginAPI] FAIL: Missing email or password");
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const emailLower = String(email).trim().toLowerCase();
    console.log("[LoginAPI] Searching for pump in MongoDB with email:", emailLower);

    const pump = await getPumpByEmail(emailLower);
    console.log("[LoginAPI] Pump lookup result:", {
      found: !!pump,
      hasId: !!pump?._id,
      hasHash: !!pump?.ownerPasswordHash,
      role: pump?.role,
      email: pump?.ownerEmail,
    });

    if (!pump) {
      console.log("[LoginAPI] FAIL: Pump not found for email:", emailLower);
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (!pump.ownerPasswordHash) {
      console.log("[LoginAPI] FAIL: Pump has no password hash");
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const isPasswordValid = verifyPassword(password, pump.ownerPasswordHash);
    console.log("[LoginAPI] Password verification:", {
      isValid: isPasswordValid,
      inputPasswordLength: password.length,
      storedHashLength: pump.ownerPasswordHash.length,
    });

    if (!isPasswordValid) {
      console.log("[LoginAPI] FAIL: Password mismatch");
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    console.log("[LoginAPI] Password verified, checking role:", pump.role);

    if (pump.role !== "pump-owner") {
      console.log("[LoginAPI] FAIL: Role is not pump-owner, role:", pump.role);
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const pumpId = pump._id!.toString();
    console.log("[LoginAPI] SUCCESS: All checks passed, creating session for pumpId:", pumpId);

    const cookieStore = await cookies();
    cookieStore.set("pump_owner_session", JSON.stringify({ pumpId, email: pump.ownerEmail, role: "pump-owner" }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });

    return NextResponse.json({
      success: true,
      role: "pump-owner",
      redirectUrl: "/pump-owner/dashboard",
      user: { email: pump.ownerEmail, pumpId, pumpName: pump.name },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[LoginAPI] Exception:", message, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
