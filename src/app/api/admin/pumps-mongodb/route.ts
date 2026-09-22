import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createPump, getAllPumps, getPumpById, deletePump, updatePump } from "@/lib/db/pump-service";
import { hashPassword } from "@/lib/auth/password";

function withoutSecrets<T extends { ownerPasswordHash?: string }>(pump: T): Omit<T, "ownerPasswordHash"> {
  const { ownerPasswordHash: _hash, ...rest } = pump;
  return rest;
}

async function getAdminId(): Promise<string | null> {
  console.log("\n[GetAdminId] ========== START AUTH CHECK ==========");

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("admin_session");

  console.log("[GetAdminId] All cookies:", {
    allCookies: cookieStore.getAll().map(c => c.name),
    adminSessionExists: !!sessionCookie,
  });

  console.log("[GetAdminId] admin_session cookie:", {
    exists: !!sessionCookie,
    name: sessionCookie?.name,
    valueLength: sessionCookie?.value?.length,
    value: sessionCookie?.value ? `${sessionCookie.value.substring(0, 50)}...` : "NONE",
  });

  if (!sessionCookie) {
    console.log("[GetAdminId] ❌ FAIL: No admin_session cookie found");
    console.log("[GetAdminId] User is NOT logged in as Admin");
    return null;
  }

  try {
    const session = JSON.parse(sessionCookie.value);
    console.log("[GetAdminId] ✓ Session parsed successfully:", {
      hasAdminId: !!session.adminId,
      adminId: session.adminId?.substring(0, 20),
      email: session.adminEmail,
      role: session.role,
    });
    console.log("[GetAdminId] ========== AUTH CHECK PASSED ==========\n");
    return session.adminId;
  } catch (error) {
    console.error("[GetAdminId] ❌ FAIL: Session parse error:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  console.log("\n[PumpsAPI POST] ========== CREATE PUMP START ==========");
  console.log("[PumpsAPI POST] Request headers - cookie:", request.headers.get("cookie")?.substring(0, 50));

  try {
    console.log("[PumpsAPI POST] Checking admin auth...");
    const adminId = await getAdminId();

    if (!adminId) {
      console.error("[PumpsAPI POST] ❌ UNAUTHORIZED: No valid admin session");
      return NextResponse.json({ error: "Unauthorized — please log in as Admin first (/admin/login)" }, { status: 401 });
    }

    console.log("[PumpsAPI POST] ✓ Admin authenticated, adminId:", adminId.substring(0, 20));

    const body = await request.json();
    const { name, companyName, ownerName, ownerEmail, password, phone, address, city, status } = body;

    // Only pumpName + ownerName are truly required — the form auto-generates
    // ownerEmail/password from them, and phone/address/city fall back to
    // "N/A" client-side. Report exactly which required field is missing
    // instead of a generic "Missing required fields" that gives no signal
    // about which one to fix.
    const required: Record<string, unknown> = { name, ownerName, ownerEmail, password, phone, address, city };
    const missing = Object.entries(required)
      .filter(([, value]) => typeof value !== "string" || value.trim() === "")
      .map(([key]) => key);

    if (missing.length > 0) {
      console.warn("[PumpsAPI POST] ❌ Validation failed — missing/empty fields:", missing, "received body:", { ...body, password: body.password ? "***" : body.password });
      return NextResponse.json(
        { error: `Missing or empty required field(s): ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    console.log("[PumpsAPI] POST create pump:", { name, ownerEmail, city, adminId });
    const passwordHash = hashPassword(password);
    console.log("[PumpsAPI] Creating pump with email:", ownerEmail.toLowerCase());

    const pump = await createPump(
      {
        name,
        companyName: companyName || undefined,
        ownerName,
        ownerEmail: String(ownerEmail).trim().toLowerCase(),
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
  console.log("\n[PumpsAPI GET] ========== REQUEST START ==========");
  console.log("[PumpsAPI GET] URL:", request.url);
  console.log("[PumpsAPI GET] Request headers:", {
    cookie: request.headers.get("cookie")?.substring(0, 50),
    contentType: request.headers.get("content-type"),
  });

  try {
    const pumpId = new URL(request.url).searchParams.get("pumpId");
    console.log("[PumpsAPI GET] Query param pumpId:", pumpId);

    // If pumpId is provided, allow pump owners to fetch their pump data
    if (pumpId) {
      console.log("[PumpsAPI GET] → Fetching single pump by ID (pump owner access)");
      const pump = await getPumpById(pumpId);
      if (!pump) {
        console.log("[PumpsAPI GET] ❌ Pump not found:", pumpId);
        return NextResponse.json({ error: "Pump not found" }, { status: 404 });
      }
      console.log("[PumpsAPI GET] ✓ Pump found, returning data");
      return NextResponse.json({ success: true, pump: withoutSecrets(pump) });
    }

    // Otherwise, require admin authentication to list all pumps
    console.log("[PumpsAPI GET] → Fetching all pumps (requires admin auth)");
    console.log("[PumpsAPI GET] Calling getAdminId()...");
    const adminId = await getAdminId();

    if (!adminId) {
      console.log("[PumpsAPI GET] ❌ UNAUTHORIZED: No valid admin session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[PumpsAPI GET] ✓ Admin authenticated, admin ID:", adminId.substring(0, 20));
    const pumps = await getAllPumps();
    console.log("[PumpsAPI GET] ✓ Fetched", pumps.length, "pumps from MongoDB");
    console.log("[PumpsAPI GET] ========== REQUEST SUCCESS ==========\n");
    return NextResponse.json({ success: true, pumps: pumps.map(withoutSecrets) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[PumpsAPI GET] ❌ EXCEPTION:", message);
    console.error("[PumpsAPI GET] Stack:", error instanceof Error ? error.stack : "N/A");
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

export async function PUT(request: NextRequest) {
  try {
    const adminId = await getAdminId();
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized — please log in as Admin first (/admin/login)" }, { status: 401 });
    }

    const { pumpId, password, status, accountStatus } = await request.json();
    if (!pumpId || (!password && !status && !accountStatus)) {
      return NextResponse.json({ error: "Missing pumpId, and at least one of password/status/accountStatus" }, { status: 400 });
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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
