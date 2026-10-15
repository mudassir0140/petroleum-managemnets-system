import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { authenticateTruck } from "@/lib/truck/service";
import { TRUCK_COOKIE_NAME } from "@/lib/truck/session";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Called by the shared login page. Only a truck (driver) account can sign in here.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const username = typeof body?.username === "string" ? body.username.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    if (!username || !password) return jsonError(400, "Username and password required");

    const result = await authenticateTruck(username, password);
    if (!result.ok) return jsonError(result.status, result.error);

    const cookieStore = await cookies();
    cookieStore.set(TRUCK_COOKIE_NAME, result.data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return jsonNoStore({
      success: true,
      role: "truck",
      redirectUrl: "/truck",
      user: { driverName: String(result.data.truck.driverName ?? ""), truckNumber: String(result.data.truck.registrationNumber ?? "") },
    });
  } catch (error) {
    console.error("[TruckLogin] error:", error);
    return jsonError(500, "Server/database error");
  }
}
