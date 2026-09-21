import { NextRequest, NextResponse } from "next/server";
import { adminSignup } from "@/lib/db/admin-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, phone } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const admin = await adminSignup(email, password, name, phone);
    if (!admin) {
      return NextResponse.json(
        { error: "Failed to create admin account" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, admin: { _id: admin._id, email: admin.email, name: admin.name } },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
