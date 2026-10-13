import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authenticateSupplier } from "@/lib/supplier/service";
import { SUPPLIER_COOKIE_NAME } from "@/lib/supplier/session";

// Called from the shared login page after the pump-owner and khata attempts.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const username = typeof body?.username === "string" ? body.username.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 });
    }

    const result = await authenticateSupplier(username, password);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    const cookieStore = await cookies();
    cookieStore.set(SUPPLIER_COOKIE_NAME, result.data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
    });

    return NextResponse.json({
      success: true,
      role: "supplier",
      redirectUrl: "/supplier/dashboard",
      user: { companyName: result.data.supplier.companyName, username: result.data.supplier.username },
    });
  } catch (error) {
    console.error("[SupplierLogin] error:", error);
    return NextResponse.json({ error: "Server/database error" }, { status: 500 });
  }
}
