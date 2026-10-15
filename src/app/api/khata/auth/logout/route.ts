import { NextResponse } from "next/server";
import { endSession } from "@/lib/auth/logout";

// Same logout as every other role. The cookie is HTTP-only, so only the server can remove it.
export async function POST() {
  await endSession();
  return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
}
