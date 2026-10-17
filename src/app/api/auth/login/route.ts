import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDatabase } from "@/lib/db/mongodb";
import { verifyPassword } from "@/lib/auth/password";
import type { PumpRecord } from "@/lib/db/models";
import { normalizeOwnerEmail } from "@/lib/auth/owner-credentials";

// Single source of truth: the `pumps` collection. The Admin's create-pump
// route (/api/admin/pumps) writes ownerEmail / ownerPasswordHash /
// role on that same document, so deleting the pump removes the login too.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    // Same rule the Admin create route and /api/pump-owner/login use, so the identifier matches the stored ownerEmail.
    const email = typeof body?.email === "string" ? normalizeOwnerEmail(body.email) : "";
    const username = typeof body?.username === "string" ? body.username.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    const fail = (status: number, error: string) => NextResponse.json({ error }, { status });

    if (!password || (!email && !username)) {
      return fail(400, "Email or username and password required");
    }

    const db = await getDatabase();

    // Khata Client login (username/password)
    if (!email) {
      const client = await db.collection("khataClients").findOne({ username });
      if (!client) return fail(401, "Account not found");
      if (client.password !== password) return fail(401, "Wrong password");

      const cookieStore = await cookies();
      cookieStore.set("khata_client_session", JSON.stringify({
        khataClientId: String(client._id),
        pumpId: client.pumpId ? String(client.pumpId) : null,
        clientName: client.clientName ?? "",
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
        user: { username: client.username ?? username, clientName: client.clientName ?? "" },
      });
    }

    // Email-based login (pump owner)
    const pump = await db.collection<PumpRecord>("pumps").findOne({ ownerEmail: email });
    if (!pump) return fail(401, "Account not found");
    if (!pump.ownerPasswordHash || !verifyPassword(password, pump.ownerPasswordHash)) {
      return fail(401, "Wrong password");
    }
    if (pump.accountStatus === "inactive") return fail(401, "Account is inactive");
    if (pump.status === "Offline") {
      return fail(403, "This pump is currently offline. Contact your administrator.");
    }
    if (pump.role !== "pump-owner" || !pump._id) return fail(401, "Account not found");

    const pumpId = pump._id.toString();
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
  } catch (error) {
    console.error("[login]", error);
    return NextResponse.json({ error: "Server/database error" }, { status: 500 });
  }
}
