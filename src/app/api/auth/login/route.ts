import { NextRequest, NextResponse } from "next/server";
import { authenticatePumpOwner } from "@/lib/db/pump-owner-account";
import { getPumpById } from "@/lib/db/pump-service";
import { cookies } from "next/headers";

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

    // Try to authenticate as pump owner first
    const pumpOwnerAccount = await authenticatePumpOwner(email, password);

    if (pumpOwnerAccount) {
      // Get the pump details
      const pump = await getPumpById(pumpOwnerAccount.pumpId.toString());

      if (!pump) {
        return NextResponse.json(
          { error: "Pump not found" },
          { status: 404 }
        );
      }

      // Set secure session cookie
      const cookieStore = await cookies();
      cookieStore.set("pump_owner_session", JSON.stringify({
        userId: pumpOwnerAccount._id?.toString(),
        pumpId: pump._id?.toString(),
        email: pumpOwnerAccount.email,
        name: pumpOwnerAccount.pumpName,
        ownerName: pumpOwnerAccount.ownerName,
        role: "pump-owner",
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60,
      });

      return NextResponse.json({
        success: true,
        role: "pump-owner",
        redirectUrl: "/pump-owner/dashboard",
        user: {
          email: pumpOwnerAccount.email,
          pumpId: pumpOwnerAccount.pumpId,
          pumpName: pumpOwnerAccount.pumpName,
        },
      });
    }

    // If not pump owner, return error
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[LoginAPI] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
