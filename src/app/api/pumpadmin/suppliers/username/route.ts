import { NextRequest, NextResponse } from "next/server";
import { getPumpAdminSessionOrNull } from "@/lib/supplier/session";
import { buildSupplierUsername } from "@/lib/supplier/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Preview of the username the form will create. The server still builds the final one on save.
export async function GET(request: NextRequest) {
  try {
    const session = await getPumpAdminSessionOrNull();
    if (!session?.pumpId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ownerName = request.nextUrl.searchParams.get("ownerName") ?? "";
    const companyName = request.nextUrl.searchParams.get("companyName") ?? "";
    const username = await buildSupplierUsername(ownerName, companyName);
    return NextResponse.json({ username }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[Suppliers] username preview error:", error);
    return NextResponse.json({ error: "Failed to build username" }, { status: 500 });
  }
}
