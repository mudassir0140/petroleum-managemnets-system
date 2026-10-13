import { NextRequest, NextResponse } from "next/server";
import { toObjectId } from "@/lib/khata/ids";
import { getPumpAdminSessionOrNull } from "@/lib/supplier/session";
import { resetSupplierPassword } from "@/lib/supplier/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Sets a new supplier password and signs the supplier out. The plain password is
// returned once, so the Pump Admin can pass it on. It is not stored anywhere.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Any signed-in Pump Admin can manage a supplier company's password.
    const session = await getPumpAdminSessionOrNull();
    if (!session?.pumpId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supplierId = toObjectId((await params).id);
    if (!supplierId) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const requested = typeof body?.password === "string" ? body.password : "";
    if (requested.trim() && requested.trim().length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const result = await resetSupplierPassword(supplierId, requested);
    if (!result) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    return NextResponse.json({ success: true, ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[Suppliers] password reset error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
