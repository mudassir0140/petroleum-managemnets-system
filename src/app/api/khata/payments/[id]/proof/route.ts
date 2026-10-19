import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { khataOwner } from "@/lib/khata/api-session";
import { attachProof } from "@/lib/khata/transactions";
import { idempotencyKeyFrom } from "@/lib/khata/payments";
import { readProofUpload } from "@/lib/khata/upload";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// The owner attaches a proof image to a payment, now or later (for example the cheque photo).
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const owner = await khataOwner();
    if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = (await params).id;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

    const upload = await readProofUpload(request);
    if (!upload.ok) return NextResponse.json({ error: upload.error }, { status: upload.status });

    const result = await attachProof({ pumpId: new ObjectId(owner.pumpId) }, new ObjectId(id), upload.bytes, owner.name, new Date(), idempotencyKeyFrom(request.headers));
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ success: true, attachmentId: result.attachmentId });
  } catch (error) {
    console.error("[Khata Payments] proof error:", error);
    return NextResponse.json({ error: "Failed to save the image" }, { status: 500 });
  }
}
