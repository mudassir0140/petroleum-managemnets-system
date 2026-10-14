import { NextRequest } from "next/server";
import { getOwnerPumpIdForApi } from "@/lib/supplier/session";
import { createSupplier, listSuppliersForPump } from "@/lib/supplier/service";
import { jsonError, jsonNoStore, supplierSecretMissing } from "@/lib/supplier/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// The owner's suppliers only: the pump id comes from the owner's session.
export async function GET() {
  try {
    const pumpId = await getOwnerPumpIdForApi();
    if (!pumpId) return jsonError(401, "Unauthorized");

    return jsonNoStore(await listSuppliersForPump(pumpId));
  } catch (error) {
    console.error("[Suppliers] GET error:", error);
    return jsonError(500, "Failed to load suppliers");
  }
}

export async function POST(request: NextRequest) {
  try {
    const pumpId = await getOwnerPumpIdForApi();
    if (!pumpId) return jsonError(401, "Unauthorized");

    const body = await request.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const companyName = typeof body?.companyName === "string" ? body.companyName.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const advanceRaw = body?.advance;
    const advance = advanceRaw === undefined || advanceRaw === null || advanceRaw === "" ? 0 : parseFloat(String(advanceRaw));

    if (!name || !companyName) return jsonError(400, "Name and company name are required");
    if (!Number.isFinite(advance) || advance < 0) return jsonError(400, "Advance must be 0 or more");
    if (password.length < 6) return jsonError(400, "Password must be at least 6 characters");
    if (supplierSecretMissing()) return jsonError(500, "Server setup is incomplete: SUPPLIER_SECRET is not set");

    const result = await createSupplier(pumpId, { name, companyName, advance, password });
    if (!result.ok) return jsonError(result.status, result.error);
    return jsonNoStore(result.data, 201);
  } catch (error: unknown) {
    if ((error as { code?: number })?.code === 11000) return jsonError(409, "Username already exists, try again");
    console.error("[Suppliers] POST error:", error);
    return jsonError(500, "Failed to create supplier account");
  }
}
