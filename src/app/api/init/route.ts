import { NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/db/init";

export async function POST() {
  try {
    console.log("[Init] Starting file storage initialization...");

    await initializeDatabase();

    console.log("[Init] File storage initialization complete");

    return NextResponse.json(
      {
        success: true,
        message: "File storage initialized successfully",
        dataDir: "data/",
        files: ["pumps.json", "employees.json", "users.json", "approval-requests.json", "managers.json"]
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Init] Error:", message);
    return NextResponse.json(
      {
        success: false,
        error: message,
        hint: "Check that the /data directory is writable"
      },
      { status: 500 }
    );
  }
}
