import { NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/db/init";
<<<<<<< HEAD

export async function POST() {
  try {
    console.log("[Init] Starting file storage initialization...");
=======
import { initializeAdmins } from "@/lib/storage/admins-storage";

export async function POST() {
  try {
    console.log("[Init] Starting initialization...");
>>>>>>> 2d242d75cdea8f65ba2668fa7f4b6a7ba774da3b

    // Initialize database (localStorage and in-memory)
    await initializeDatabase();
    await initializeAdmins();

<<<<<<< HEAD
    console.log("[Init] File storage initialization complete");
=======
    console.log("[Init] Initialization complete");
>>>>>>> 2d242d75cdea8f65ba2668fa7f4b6a7ba774da3b

    return NextResponse.json(
      {
        success: true,
<<<<<<< HEAD
        message: "File storage initialized successfully",
        dataDir: "data/",
        files: ["pumps.json", "employees.json", "users.json", "approval-requests.json", "managers.json"]
=======
        message: "System initialized successfully",
        collections: ["pumps", "employees", "users", "approval_requests", "admins"],
>>>>>>> 2d242d75cdea8f65ba2668fa7f4b6a7ba774da3b
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
<<<<<<< HEAD
        hint: "Check that the /data directory is writable"
=======
>>>>>>> 2d242d75cdea8f65ba2668fa7f4b6a7ba774da3b
      },
      { status: 500 }
    );
  }
}
