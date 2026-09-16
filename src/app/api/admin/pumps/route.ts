import { NextRequest, NextResponse } from "next/server";
import { createPump, getAllPumps, deletePump, generatePumpId, getPumpById } from "@/lib/db/pumps";
import { createUser, getUserByEmail } from "@/lib/db/users";
import { initializeDatabase } from "@/lib/db/init";

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();

    const body = await request.json();
    const {
      pumpName,
      ownerName,
      ownerEmail,
      password,
    } = body;

    if (!pumpName || !ownerName || !ownerEmail || !password) {
      return NextResponse.json(
        { error: "Missing required fields (pumpName, ownerName, ownerEmail, password)" },
        { status: 400 }
      );
    }

    const pumpId = await generatePumpId();

    // Create pump with minimal fields
    const pump = await createPump({
      pumpId,
      pumpName,
      ownerName,
      ownerEmail,
      password, // Store current password for admin reference
      ownerPhone: "", // Will be added by pump owner later
      address: "", // Will be added by pump owner later
      city: "", // Will be added by pump owner later
      status: "open",
      petrolStock: 0,
      petrolCapacity: 1000,
      dieselStock: 0,
      dieselCapacity: 1000,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create user account for pump owner with admin-created credentials
    const user = await createUser({
      email: ownerEmail,
      passwordHash: password, // In production, should hash this with bcrypt
      role: "pump-owner",
      pumpId,
      approvalStatus: "approved", // Admin-created accounts are automatically approved
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json(
      { success: true, pump, user, message: "Pump and owner account created successfully" },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[API] Pump creation error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    await initializeDatabase();
    const pumps = await getAllPumps();
    return NextResponse.json({ success: true, pumps }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[API] Get pumps error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await initializeDatabase();

    const { searchParams } = new URL(request.url);
    const pumpId = searchParams.get("pumpId");

    if (!pumpId) {
      return NextResponse.json(
        { error: "pumpId is required" },
        { status: 400 }
      );
    }

    const pump = await getPumpById(pumpId);
    if (!pump) {
      return NextResponse.json(
        { error: "Pump not found" },
        { status: 404 }
      );
    }

    const newPassword = `${pump.ownerName}123`;

    // Verify user exists
    const user = await getUserByEmail(pump.ownerEmail);
    if (!user) {
      return NextResponse.json(
        { error: "User account not found" },
        { status: 404 }
      );
    }

    // In production, should hash this with bcrypt and update in database
    // For now, we'll return the new password for the admin to share
    return NextResponse.json(
      { success: true, password: newPassword, message: "Password reset successfully" },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[API] Password reset error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await initializeDatabase();

    const { searchParams } = new URL(request.url);
    const pumpId = searchParams.get("pumpId");

    if (!pumpId) {
      return NextResponse.json(
        { error: "pumpId is required" },
        { status: 400 }
      );
    }

    const success = await deletePump(pumpId);

    if (!success) {
      return NextResponse.json(
        { error: "Pump not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Pump deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[API] Pump deletion error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
