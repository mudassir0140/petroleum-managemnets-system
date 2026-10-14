import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { authenticateSupplier } from "@/lib/supplier/service";
import { SUPPLIER_COOKIE_NAME } from "@/lib/supplier/session";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Called by the shared login page. Only a supplier account can sign in here.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const username = typeof body?.username === "string" ? body.username.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    if (!username || !password) return jsonError(400, "Username and password required");

    const result = await authenticateSupplier(username, password);
    if (!result.ok) return jsonError(result.status, result.error);

    const cookieStore = await cookies();
    cookieStore.set(SUPPLIER_COOKIE_NAME, result.data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 365 * 24 * 60 * 60,
    });

    return jsonNoStore({
      success: true,
      role: "supplier",
      redirectUrl: "/supplier",
      user: { name: result.data.supplier.name ?? "", companyName: result.data.supplier.companyName ?? "" },
    });
  } catch (error) {
    console.error("[SupplierLogin] error:", error);
    return jsonError(500, "Server/database error");
  }
}
