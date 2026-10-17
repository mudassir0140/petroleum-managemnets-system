import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { khataClientSession } from "@/lib/khata/client-session";
import { attachProof } from "@/lib/khata/transactions";
import { readProofUpload } from "@/lib/khata/upload";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// A client adds a proof image (cheque photo or transfer screenshot) to their own payment only.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await khataClientSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = (await params).id;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

    const upload = await readProofUpload(request);
    if (!upload.ok) return NextResponse.json({ error: upload.error }, { status: upload.status });

    const result = await attachProof(
      { pumpId: session.pumpId, khataClientId: session.khataClientId },
      new ObjectId(id),
      upload.bytes,
      session.name || "client",
      new Date()
    );
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ success: true, attachmentId: result.attachmentId });
  } catch (error) {
    console.error("[Client Khata Payments] proof error:", error);
    return NextResponse.json({ error: "Failed to save the image" }, { status: 500 });
  }
}
