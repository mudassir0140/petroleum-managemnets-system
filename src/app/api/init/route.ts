import { NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/db/init";
import { initializeAdmins } from "@/lib/storage/admins-storage";

export async function POST() {
  try {
    console.log("[Init] Starting initialization...");

    // Initialize database (localStorage and in-memory)
    await initializeDatabase();
    await initializeAdmins();

    console.log("[Init] Initialization complete");

    return NextResponse.json(
      {
        success: true,
        message: "System initialized successfully",
        collections: ["pumps", "employees", "users", "approval_requests", "admins"],
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
      },
      { status: 500 }
    );
  }
}
