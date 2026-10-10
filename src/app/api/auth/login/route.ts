import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDatabase } from "@/lib/db/mongodb";
import { getPumpByEmail } from "@/lib/db/pump-service";
import { verifyPassword } from "@/lib/auth/password";
import { ObjectId } from "mongodb";

// Single source of truth: the `pumps` collection. The Admin's create-pump
// route (/api/admin/pumps) writes ownerEmail / ownerPasswordHash /
// role on that same document, so deleting the pump removes the login too.
export async function POST(request: NextRequest) {
  try {
    const { email, password, username } = await request.json();

    // Khata Client login (username/password)
    if (username && !email) {
      if (!username || !password) {
        return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
      }

      try {
        const db = await getDatabase();
        const collection = db.collection("khataClients");
        const normalizedUsername = username.trim().toLowerCase();

        const client = await collection.findOne({
          username: normalizedUsername,
          password,
        });

        if (!client) {
          return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
        }

        const cookieStore = await cookies();
        cookieStore.set("khata_client_session", JSON.stringify({
          khataClientId: client._id.toString(),
          pumpId: client.pumpId.toString(),
          clientName: client.clientName,
          role: "khata-client",
        }), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 24 * 60 * 60,
        });

        return NextResponse.json({
          success: true,
          role: "khata-client",
          redirectUrl: "/khata-client/dashboard",
          user: { username: client.username, clientName: client.clientName },
        });
      } catch (err) {
        console.error("[Khata Login Error]", err);
        return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
      }
    }

    // Email-based login (pump owner)
    if (!username || !email) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const pump = await getPumpByEmail(String(email).trim());
    if (!pump || !pump.ownerPasswordHash || !verifyPassword(password, pump.ownerPasswordHash)) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (pump.accountStatus === "inactive") {
      return NextResponse.json({ error: "This account has been deactivated. Contact your administrator." }, { status: 403 });
    }

    if (pump.status === "Offline") {
      return NextResponse.json({ error: "This pump is currently offline. Contact your administrator." }, { status: 403 });
    }

    if (pump.role === "pump-owner") {
      const pumpId = pump._id!.toString();
      const cookieStore = await cookies();
      cookieStore.set("pump_owner_session", JSON.stringify({ pumpId, email: pump.ownerEmail, role: "pump-owner" }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60,
      });
      return NextResponse.json({
        success: true,
        role: "pump-owner",
        redirectUrl: "/pumpadmin",
        user: { email: pump.ownerEmail, pumpId, pumpName: pump.name },
      });
    }

    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[LoginAPI]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
