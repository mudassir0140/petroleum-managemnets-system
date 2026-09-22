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
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const pump = await getPumpByEmail(String(email).trim());
    if (!pump || !pump.ownerPasswordHash || !verifyPassword(password, pump.ownerPasswordHash)) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (pump.accountStatus === "inactive") {
      return NextResponse.json({ error: "This account has been deactivated. Contact your administrator." }, { status: 403 });
    }

    if (pump.status === "Offline") {
      return NextResponse.json({ error: "This pump is currently offline. Contact your administrator." }, { status: 403 });
    }

    if (pump.role === "pump-owner") {
      const pumpId = pump._id!.toString();
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
    }

    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[LoginAPI]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
