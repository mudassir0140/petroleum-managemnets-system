import { NextRequest, NextResponse } from "next/server";
import { adminLogin } from "@/lib/db/admin-service";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  console.log("\n[AdminLogin] ========== ADMIN LOGIN START ==========");

  try {
    const body = await request.json();
    const { email, password } = body;
    console.log("[AdminLogin] Login attempt for email:", email);

    if (!email || !password) {
      console.log("[AdminLogin] ❌ Missing email or password");
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    console.log("[AdminLogin] Attempting to authenticate with adminLogin()...");
    const admin = await adminLogin(email, password);

    if (!admin) {
      console.log("[AdminLogin] ❌ Authentication failed for email:", email);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    console.log("[AdminLogin] ✓ Admin authenticated:", {
      id: admin._id?.toString().substring(0, 20),
      email: admin.email,
      name: admin.name,
    });

    // Set secure session cookie
    console.log("[AdminLogin] Setting admin_session cookie...");
    const cookieStore = await cookies();
    const sessionData = {
      userId: admin._id?.toString(),
      email: admin.email,
      name: admin.name,
      role: "admin",
    };

    cookieStore.set("admin_session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    console.log("[AdminLogin] ✓ admin_session cookie set successfully");
    console.log("[AdminLogin] ========== ADMIN LOGIN SUCCESS ==========\n");

    return NextResponse.json({
      success: true,
      admin: { _id: admin._id, email: admin.email, name: admin.name, role: "admin" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[AdminLogin] ❌ EXCEPTION:", message);
    console.error("[AdminLogin] Stack:", error instanceof Error ? error.stack : "N/A");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
