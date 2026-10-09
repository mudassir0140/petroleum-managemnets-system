import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDatabase } from "@/lib/db/mongodb";
import { hashPassword } from "@/lib/auth/password";
import { getPumpById } from "@/lib/db/pump-service";
import { ObjectId } from "mongodb";

function generateUsername(name: string, pumpName: string): string {
  const baseName = name.toLowerCase().replace(/\s+/g, "");
  const basePump = pumpName.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
  return `${baseName}.${basePump}`;
}

function sanitizeUsername(username: string): string {
  return username.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9.]/g, "");
}

async function ensureUniqueUsername(
  collection: any,
  baseUsername: string,
  pumpId: ObjectId
): Promise<string> {
  let username = sanitizeUsername(baseUsername);
  let counter = 1;

  while (true) {
    const existing = await collection.findOne({
      username,
      pumpId,
    });

    if (!existing) {
      return username;
    }

    username = sanitizeUsername(`${baseUsername}${counter}`);
    counter++;
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.pumpId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    const collection = db.collection("pump_employees");
    const employees = await collection
      .find({ pumpId: new ObjectId(session.pumpId) })
      .toArray();

    return NextResponse.json(employees.map((emp: any) => ({
      _id: emp._id.toString(),
      name: emp.name,
      phone: emp.phone,
      role: emp.role,
      username: emp.username,
      createdAt: emp.createdAt,
    })));
  } catch (error) {
    console.error("[PumpAdminEmployees] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.pumpId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, password, role } = body;

    if (!name || !phone || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const pumpId = new ObjectId(session.pumpId);

    const pump = await getPumpById(session.pumpId);
    if (!pump) {
      return NextResponse.json(
        { error: "Pump not found" },
        { status: 404 }
      );
    }

    const collection = db.collection("pump_employees");

    const baseUsername = generateUsername(name, pump.name);
    const username = await ensureUniqueUsername(collection, baseUsername, pumpId);

    const passwordHash = hashPassword(password);

    const result = await collection.insertOne({
      pumpId,
      name,
      phone,
      role,
      username,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      _id: result.insertedId.toString(),
      name,
      phone,
      role,
      username,
      password,
      pumpName: pump.name,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("[PumpAdminEmployees] POST error:", error);
    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 }
    );
  }
}
