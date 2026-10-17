import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { khataOwner } from "@/lib/khata/api-session";
import { getAttachment } from "@/lib/khata/transactions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// A proof image, for the owner of the pump only. It is served with its checked type and no caching.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const owner = await khataOwner();
    if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = (await params).id;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Image not found" }, { status: 404 });

    const doc = await getAttachment({ pumpId: new ObjectId(owner.pumpId) }, new ObjectId(id));
    if (!doc) return NextResponse.json({ error: "Image not found" }, { status: 404 });

    const bytes = Buffer.from(doc.data.buffer).subarray(0, doc.data.length());
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": String(doc.mime),
        "Content-Length": String(bytes.length),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
      },
    });
  } catch (error) {
    console.error("[Khata Attachments] GET error:", error);
    return NextResponse.json({ error: "Failed to load the image" }, { status: 500 });
  }
}
