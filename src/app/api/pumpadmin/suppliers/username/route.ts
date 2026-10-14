import { NextRequest } from "next/server";
import { getOwnerPumpIdForApi } from "@/lib/supplier/session";
import { buildSupplierUsername } from "@/lib/supplier/service";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Preview of the username the form will save. The server builds the final one on save.
export async function GET(request: NextRequest) {
  try {
    const pumpId = await getOwnerPumpIdForApi();
    if (!pumpId) return jsonError(401, "Unauthorized");

    const name = request.nextUrl.searchParams.get("name")?.trim() ?? "";
    const companyName = request.nextUrl.searchParams.get("companyName")?.trim() ?? "";
    if (!name || !companyName) return jsonNoStore({ username: "" });

    return jsonNoStore({ username: await buildSupplierUsername(name, companyName) });
  } catch (error) {
    console.error("[Suppliers] username preview error:", error);
    return jsonError(500, "Failed to build username");
  }
}
