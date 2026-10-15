import { NextResponse } from "next/server";
import { performLogout } from "@/lib/auth/logout";

// Khata client logout: the shared logout (the session cookie is HTTP-only, so the server clears it).
export async function POST() {
  await performLogout();
  return NextResponse.json({ success: true });
}
