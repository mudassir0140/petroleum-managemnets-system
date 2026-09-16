import { NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/db/init";
import { connectToDatabase } from "@/lib/db/mongodb";

export async function POST() {
  try {
    console.log("[Init] Starting database initialization...");

    const { db } = await connectToDatabase();

    await initializeDatabase();

    console.log("[Init] Database initialization complete");

    return NextResponse.json(
      {
        success: true,
        message: "Database initialized successfully",
        collections: ["pumps", "employees", "users", "approval_requests"]
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
        hint: "Make sure MongoDB is running. Start it with: mongod"
      },
      { status: 500 }
    );
  }
}
