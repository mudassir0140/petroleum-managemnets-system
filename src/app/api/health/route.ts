import { connectToDatabase } from "@/lib/db/mongodb";

export async function GET() {
  try {
    const { client, db } = await connectToDatabase();

    if (!db) {
      return Response.json(
        { status: "error", message: "Database connection failed" },
        { status: 500 }
      );
    }

    const admin = db.admin();
    await admin.ping();

    return Response.json({
      status: "success",
      message: "MongoDB connection successful",
      database: "boot_auto_play",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[API] Health check failed:", error);
    return Response.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
