import { NextResponse } from "next/server";
import { DatabaseUnavailableError } from "./mongodb";

// Turns a failure into a JSON response. A database outage returns 503 with a
// clear message; anything else returns the route's own fallback message with 500.
export function databaseErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof DatabaseUnavailableError) {
    return NextResponse.json(
      { error: error.message, code: "DB_UNAVAILABLE" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
