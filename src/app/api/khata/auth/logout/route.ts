import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Clears the khata client session. The cookie is HTTP-only, so only the server can remove it.
export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("khata_client_session");
  return NextResponse.json({ success: true });
}
