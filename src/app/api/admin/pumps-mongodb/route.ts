import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createPump, getAllPumps, getPumpById, deletePump } from "@/lib/db/pump-service";
import { hashPassword } from "@/lib/auth/password";

function withoutSecrets<T extends { ownerPasswordHash?: string }>(pump: T): Omit<T, "ownerPasswordHash"> {
  const { ownerPasswordHash: _hash, ...rest } = pump;
  return rest;
}

async function getAdminId(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("admin_session");
  if (!sessionCookie) return null;

  try {
    const session = JSON.parse(sessionCookie.value);
    return session.userId;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminId = await getAdminId();
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, ownerName, ownerEmail, password, phone, address, city, status } = await request.json();
    if (!name || !ownerName || !ownerEmail || !password || !phone || !address || !city) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const passwordHash = hashPassword(password);
    console.log("[PumpsAPI] Creating pump with email:", ownerEmail.toLowerCase());

    const pump = await createPump(
      {
        name,
        ownerName,
        ownerEmail: String(ownerEmail).trim().toLowerCase(),
        ownerPasswordHash: passwordHash,
        role: "pump-owner",
        phone,
        address,
        city,
        status: (status || "Online") as "Online" | "Offline" | "Maintenance",
        petrolStock: 5000,
        petrolCapacity: 10000,
        dieselStock: 4000,
        dieselCapacity: 10000,
      },
      adminId
    );

    if (!pump) {
      console.error("[PumpsAPI] Failed to create pump");
      return NextResponse.json({ error: "Failed to create pump" }, { status: 400 });
    }

    console.log("[PumpsAPI] Pump created with login credentials, ID:", pump._id);

    return NextResponse.json(
      {
        success: true,
        pump: withoutSecrets(pump),
        credentials: { email: pump.ownerEmail, password },
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[PumpsAPI] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const pumpId = new URL(request.url).searchParams.get("pumpId");
    if (pumpId) {
      console.log("[PumpsAPI] Fetching pump by ID:", pumpId);
      const pump = await getPumpById(pumpId);
      if (!pump) {
        return NextResponse.json({ error: "Pump not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, pump: withoutSecrets(pump) });
    }

    const adminId = await getAdminId();
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pumps = await getAllPumps();
    return NextResponse.json({ success: true, pumps: pumps.map(withoutSecrets) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Deleting the pump document also deletes its login (email/password/role
// live on the same record), so those credentials stop working immediately.
export async function DELETE(request: NextRequest) {
  try {
    const adminId = await getAdminId();
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pumpId = request.nextUrl.searchParams.get("pumpId");
    if (!pumpId) {
      return NextResponse.json({ error: "Missing pumpId" }, { status: 400 });
    }

    const deleted = await deletePump(pumpId);
    if (!deleted) {
      return NextResponse.json({ error: "Pump not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
