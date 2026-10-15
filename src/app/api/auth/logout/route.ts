import { NextResponse } from "next/server";
import { clearAllSessionCookies } from "@/lib/auth/clear-session";

// Shared logout for client code. Clears every session cookie, including HttpOnly ones
// that the browser cannot remove by itself.
export async function POST() {
  await clearAllSessionCookies();
  return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
}
