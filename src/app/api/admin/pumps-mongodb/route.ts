import { NextRequest, NextResponse } from "next/server";
import { createPump, getAllPumps, updatePump, deletePump } from "@/lib/db/pump-service";
import { createPumpOwnerAccount } from "@/lib/db/pump-owner-account";
import { cookies } from "next/headers";
import { hashPassword } from "@/lib/auth/password";

function withoutSecrets<T extends { ownerPasswordHash?: string; password?: string }>(
  obj: T
): Omit<T, "ownerPasswordHash" | "password"> {
  const { ownerPasswordHash: _hash, password: _pwd, ...rest } = obj as any;
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

    const body = await request.json();
    const { name, ownerName, ownerEmail, password, phone, address, city, status } = body;

    if (!name || !ownerName || !ownerEmail || !password || !phone || !address || !city) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const passwordHash = hashPassword(password);
    const pump = await createPump(
      {
        name,
        ownerName,
        ownerEmail: String(ownerEmail).trim().toLowerCase(),
        ownerPasswordHash: passwordHash,
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
      return NextResponse.json(
        { error: "Failed to create pump" },
        { status: 400 }
      );
    }

    // Create pump owner account for login
    const account = await createPumpOwnerAccount({
      ...pump,
      ownerPasswordHash: passwordHash,
    });

    if (!account) {
      console.warn("[PumpsAPI] Failed to create pump owner account, but pump was created");
    }

    return NextResponse.json(
      {
        success: true,
        pump: withoutSecrets(pump),
        credentials: {
          email: pump.ownerEmail,
          password: password, // Return plain password to display to admin
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
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
