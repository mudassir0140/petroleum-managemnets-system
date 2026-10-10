import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection("khataClients");

    const client = await collection.findOne({
      username,
      password,
    });

    if (!client) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Create response with session cookie
    const response = NextResponse.json({
      _id: client._id.toString(),
      clientName: client.clientName,
      username: client.username,
    });

    response.cookies.set("khata_client_session", JSON.stringify({
      khataClientId: client._id.toString(),
      pumpId: client.pumpId.toString(),
      clientName: client.clientName,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return response;
  } catch (error) {
    console.error("[Khata Auth] Login error:", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
