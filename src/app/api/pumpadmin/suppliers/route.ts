import { NextRequest, NextResponse } from "next/server";
import { toObjectId } from "@/lib/khata/ids";
import { KHATA_NO_STORE_HEADERS } from "@/lib/khata/no-store";
import { getPumpAdminSessionOrNull } from "@/lib/supplier/session";
import { createSupplierAccount, listSuppliersForPump } from "@/lib/supplier/service";
import { isSupplierFuelType } from "@/lib/supplier/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const session = await getPumpAdminSessionOrNull();
    const pumpId = toObjectId(session?.pumpId);
    if (!pumpId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const suppliers = await listSuppliersForPump(pumpId);
    return NextResponse.json(suppliers, { headers: KHATA_NO_STORE_HEADERS });
  } catch (error) {
    console.error("[Suppliers] GET error:", error);
    return NextResponse.json({ error: "Failed to load suppliers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getPumpAdminSessionOrNull();
    const pumpId = toObjectId(session?.pumpId);
    if (!pumpId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => null);
    const ownerName = typeof body?.ownerName === "string" ? body.ownerName.trim() : "";
    const companyName = typeof body?.companyName === "string" ? body.companyName.trim() : "";
    const location = typeof body?.location === "string" ? body.location.trim() : "";
    const contact = typeof body?.contact === "string" ? body.contact.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const fuelType = body?.fuelType;

    if (!ownerName || !companyName || !location || !contact) {
      return NextResponse.json({ error: "Owner name, company name, location and contact are required" }, { status: 400 });
    }
    if (!isSupplierFuelType(fuelType)) {
      return NextResponse.json({ error: "Choose Petrol, Diesel or Hi-Octane" }, { status: 400 });
    }
    if (password.trim().length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const supplier = await createSupplierAccount(pumpId, {
      ownerName,
      companyName,
      fuelType,
      location,
      contact,
      password: password.trim(),
    });
    return NextResponse.json(supplier, { status: 201 });
  } catch (error: unknown) {
    if ((error as { code?: number })?.code === 11000) {
      return NextResponse.json({ error: "Username already exists, try again" }, { status: 409 });
    }
    console.error("[Suppliers] POST error:", error);
    return NextResponse.json({ error: "Failed to create supplier account" }, { status: 500 });
  }
}
