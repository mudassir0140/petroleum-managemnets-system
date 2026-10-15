import { NextResponse } from "next/server";
import { endSession } from "@/lib/auth/logout";

// Route Handler: cookie changes are only allowed in a Server Action or Route Handler.
// Uses the same logout as every other role.
export async function GET(request: Request) {
  const destination = await endSession();
  return NextResponse.redirect(new URL(destination, request.url));
}
