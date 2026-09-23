import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { createPump, getAllPumps, getPumpById, deletePump, updatePump, getPumpsByOwnerEmail, getPumpByEmail } from "@/lib/db/pump-service";
import { hashPassword } from "@/lib/auth/password";
import { resolveApiActor, actorHasRole } from "@/lib/admin/api-auth";

function withoutSecrets<T extends { ownerPasswordHash?: string }>(pump: T): Omit<T, "ownerPasswordHash"> {
  const { ownerPasswordHash: _hash, ...rest } = pump;
  return rest;
}

// Reads the Admin's session cookie and returns their MongoDB _id as a
// string, or null if there's no session / it's malformed / it predates
// the MongoDB migration (old file-based admin ids like "ADM-001" aren't
// valid ObjectIds — ObjectId.isValid() catches that instead of crashing
// downstream with a raw driver error).
async function getAdminId(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("admin_session");
  if (!sessionCookie) return null;

  try {
    const session = JSON.parse(sessionCookie.value);
    if (typeof session.adminId !== "string" || !ObjectId.isValid(session.adminId)) {
      console.warn("[PumpsAPI] admin_session cookie has an invalid adminId — treating as logged out:", session.adminId);
      return null;
    }
    return session.adminId;
  } catch (error) {
    console.error("[PumpsAPI] Failed to parse admin_session cookie:", error);
    return null;
  }
}

const UNAUTHORIZED = { error: "Unauthorized — please log in as Admin first (/admin/login)" };

export async function POST(request: NextRequest) {
  try {
    const adminId = await getAdminId();
    if (!adminId) {
      return NextResponse.json(UNAUTHORIZED, { status: 401 });
    }

    const body = await request.json();
    const { name, companyName, ownerName, ownerEmail, password, phone, address, city, status } = body;

    // For branch pumps (same owner), password is optional — reuse existing owner's password.
    // For new owners, password is required.
    const normalizedEmail = String(ownerEmail).trim().toLowerCase();
    const existingPump = await getPumpByEmail(normalizedEmail);

    const required: Record<string, string | undefined> = { name, ownerName, ownerEmail, phone, address, city };
    // Only require password if this is a new owner (no existing pump)
    if (!existingPump) {
      required.password = password;
    }

    const missing = Object.entries(required)
      .filter(([, value]) => typeof value !== "string" || value.trim() === "")
      .map(([key]) => key);

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing or empty required field(s): ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    // Use existing owner's password hash for branch pumps, or hash the new password
    const passwordHash = existingPump
      ? existingPump.ownerPasswordHash
      : hashPassword(password!);

    const pump = await createPump(
      {
        name,
        companyName: companyName || undefined,
        ownerName,
        ownerEmail: normalizedEmail,
        ownerPasswordHash: passwordHash,
        role: "pump-owner",
        phone,
        address,
        city,
        status: (status || "Online") as "Online" | "Offline" | "Maintenance",
        accountStatus: "active",
        petrolStock: 5000,
        petrolCapacity: 10000,
        dieselStock: 4000,
        dieselCapacity: 10000,
      },
      adminId
    );

    console.log("[PumpsAPI] Pump created:", pump._id, pump.ownerEmail);

    return NextResponse.json(
      {
        success: true,
        pump: withoutSecrets(pump),
        credentials: existingPump
          ? { email: pump.ownerEmail, password: "(existing owner password)" }
          : { email: pump.ownerEmail, password },
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[PumpsAPI] POST error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const pumpId = new URL(request.url).searchParams.get("pumpId");
    const ownerEmail = new URL(request.url).searchParams.get("ownerEmail");

    // A pumpId query param means a pump owner is fetching their own pump —
    // no admin session required, but the id itself must be a real ObjectId.
    if (pumpId) {
      if (!ObjectId.isValid(pumpId)) {
        return NextResponse.json({ error: "Invalid pumpId" }, { status: 400 });
      }
      const pump = await getPumpById(pumpId);
      if (!pump) {
        return NextResponse.json({ error: "Pump not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, pump: withoutSecrets(pump) });
    }

    // Filter by ownerEmail if provided — for pump owners to see their other pumps.
    if (ownerEmail) {
      const pumps = await getPumpsByOwnerEmail(ownerEmail);
      return NextResponse.json({ success: true, pumps: pumps.map(withoutSecrets) });
    }

    // Otherwise, list every pump. Writes (create/status/password below)
    // stay Admin-only — pump owners are only ever created from this
    // section by Admin/Company Owner — but *viewing* the list matches
    // DASHBOARD_NAV's roles for /dashboard/pumps (company-owner,
    // company-manager), plus hr-manager for the "Add Employee" form's
    // pump dropdown (/dashboard/hr/employees).
    const actor = await resolveApiActor();
    if (!actorHasRole(actor, ["company-owner", "company-manager", "hr-manager"])) {
      return NextResponse.json(UNAUTHORIZED, { status: 401 });
    }

    const pumps = await getAllPumps();
    return NextResponse.json({ success: true, pumps: pumps.map(withoutSecrets) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[PumpsAPI] GET error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Deleting the pump document also deletes its login (email/password/role
// live on the same record), so those credentials stop working immediately.
export async function DELETE(request: NextRequest) {
  try {
    const adminId = await getAdminId();
    if (!adminId) {
      return NextResponse.json(UNAUTHORIZED, { status: 401 });
    }

    const pumpId = request.nextUrl.searchParams.get("pumpId");
    if (!pumpId || !ObjectId.isValid(pumpId)) {
      return NextResponse.json({ error: "Missing or invalid pumpId" }, { status: 400 });
    }

    const deleted = await deletePump(pumpId);
    if (!deleted) {
      return NextResponse.json({ error: "Pump not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[PumpsAPI] DELETE error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminId = await getAdminId();
    if (!adminId) {
      return NextResponse.json(UNAUTHORIZED, { status: 401 });
    }

    const { pumpId, password, status, accountStatus } = await request.json();
    if (!pumpId || !ObjectId.isValid(pumpId)) {
      return NextResponse.json({ error: "Missing or invalid pumpId" }, { status: 400 });
    }
    if (!password && !status && !accountStatus) {
      return NextResponse.json({ error: "Provide at least one of: password, status, accountStatus" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (password) updates.ownerPasswordHash = hashPassword(password);
    if (status) updates.status = status;
    if (accountStatus) updates.accountStatus = accountStatus;

    const pump = await updatePump(pumpId, updates);
    if (!pump) {
      return NextResponse.json({ error: "Pump not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, pump: withoutSecrets(pump) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[PumpsAPI] PUT error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
