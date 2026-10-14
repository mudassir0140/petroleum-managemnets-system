import { NextResponse } from "next/server";

// Supplier data must never be cached, so every response says so.
export const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export function jsonNoStore(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

export function jsonError(status: number, error: string) {
  return NextResponse.json({ error }, { status, headers: NO_STORE_HEADERS });
}
