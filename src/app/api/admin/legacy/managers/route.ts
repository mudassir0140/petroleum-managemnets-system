import { NextRequest, NextResponse } from "next/server";
import { createManager, getAllManagers, deleteManager, generateManagerId, getManagerByEmail } from "@/lib/db/managers";
import { createUser, userExists } from "@/lib/db/users";
import { getPumpById } from "@/lib/db/pumps";
import { initializeDatabase } from "@/lib/db/init";

function generateCredentials(managerName: string, pumpName: string) {
  const cleanName = managerName.toLowerCase().trim();
  const cleanPump = pumpName.toLowerCase().trim().replace(/\s+/g, "");

  return {
    email: `${cleanName}@${cleanPump}gmail.com`,
    password: `${cleanName}9870`,
  };
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();

    const body = await request.json();
    const { managerName, contactNumber, address, pumpId } = body;

    if (!managerName || !contactNumber || !address || !pumpId) {
      return NextResponse.json(
        { error: "Missing required fields (managerName, contactNumber, address, pumpId)" },
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

    const credentials = generateCredentials(managerName, pump.pumpName);

    // Check if email already exists
    const existingManager = await getManagerByEmail(credentials.email);
    if (existingManager) {
      return NextResponse.json(
        { error: "Email already exists for this manager" },
        { status: 400 }
      );
    }

    const existingUser = await userExists(credentials.email);
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 400 }
      );
    }

    const managerId = await generateManagerId();
    const now = new Date().toISOString();

    // Create manager profile
    const manager = await createManager({
      managerId,
      name: managerName,
      email: credentials.email,
      contactNumber,
      address,
      pumpId,
      pumpName: pump.pumpName,
      password: credentials.password,
      createdAt: now,
      updatedAt: now,
    });

    // Create user account for manager with admin-created credentials
    const user = await createUser({
      email: credentials.email,
      passwordHash: credentials.password, // In production, should hash this with bcrypt
      role: "pump-owner-manager",
      pumpId,
      approvalStatus: "approved", // Admin-created accounts are automatically approved
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json(
      {
        success: true,
        manager,
        user,
        credentials: {
          email: credentials.email,
          password: credentials.password,
        },
        message: "Manager created successfully with auto-generated credentials",
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[API] Manager creation error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    await initializeDatabase();
    const managers = await getAllManagers();
    return NextResponse.json({ success: true, managers }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[API] Get managers error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await initializeDatabase();

    const { searchParams } = new URL(request.url);
    const managerId = searchParams.get("managerId");

    if (!managerId) {
      return NextResponse.json(
        { error: "managerId is required" },
        { status: 400 }
      );
    }

    const success = await deleteManager(managerId);

    if (!success) {
      return NextResponse.json(
        { error: "Manager not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Manager deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[API] Manager deletion error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
