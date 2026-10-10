import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";

export async function GET() {
  try {
    const db = await getDatabase();
    const collection = db.collection("khataClients");
    const clients = await collection.find({}, { projection: { username: 1 } }).toArray();
    const usernames = clients.map((c: any) => c.username).filter(Boolean);

    return NextResponse.json({ usernames });
  } catch (error) {
    console.error("[Khata Usernames] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch usernames" },
      { status: 500 }
    );
  }
}
