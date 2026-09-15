import { NextResponse } from "next/server";
import { getAllPermissions } from "@/lib/admin/permission-actions";

export async function GET() {
  try {
    const permissions = await getAllPermissions();
    return NextResponse.json(permissions);
  } catch (error) {
    console.error("Failed to fetch permissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch permissions" },
      { status: 500 }
    );
  }
}
