import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SCOPE_COOKIES, scopeFor } from "@/lib/offline/scope";

// The browser asks for this digest before it sends queued changes, and stores it with each change it queues.
export async function GET() {
  const store = await cookies();
  const values: Record<string, string | undefined> = {};
  for (const name of SCOPE_COOKIES) values[name] = store.get(name)?.value;
  return NextResponse.json({ scope: scopeFor(values) }, { headers: { "Cache-Control": "no-store" } });
}
