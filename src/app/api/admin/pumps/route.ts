import { NextRequest, NextResponse } from "next/server";
import { createPump, getAllPumps, deletePump, generatePumpId } from "@/lib/db/pumps";
import { createUser } from "@/lib/db/users";
import { initializeDatabase } from "@/lib/db/init";

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();

    const body = await request.json();
    const {
      pumpName,
      companyName,
      ownerName,
      ownerEmail,
      ownerPhone,
      address,
      city,
      password,
      status = "open",
      petrolStock = 0,
      petrolCapacity = 1000,
      dieselStock = 0,
      dieselCapacity = 1000,
    } = body;

    if (!pumpName || !companyName || !ownerName || !ownerEmail || !ownerPhone || !address || !city || !password) {
      return NextResponse.json(
        { error: "Missing required fields (pumpName, companyName, ownerName, ownerEmail, ownerPhone, address, city, password)" },
        { status: 400 }
      );
    }

    const pumpId = await generatePumpId();

    // Create pump
    const pump = await createPump({
      pumpId,
      pumpName,
      ownerName,
      ownerEmail,
      ownerPhone,
      address,
      city,
      status: status as "open" | "low-stock" | "closed" | "disabled",
      petrolStock: Number(petrolStock),
      petrolCapacity: Number(petrolCapacity),
      dieselStock: Number(dieselStock),
      dieselCapacity: Number(dieselCapacity),
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
