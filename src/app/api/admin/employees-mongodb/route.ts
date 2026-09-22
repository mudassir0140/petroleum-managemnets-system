import { NextRequest, NextResponse } from "next/server";
import { createEmployee, getAllEmployees, updateEmployeeStatus, deleteEmployee } from "@/lib/db/employee-service";
import { hashPassword } from "@/lib/auth/password";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

async function getAdminId(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("admin_session");
  if (!sessionCookie) return null;

  try {
    const session = JSON.parse(sessionCookie.value);
    if (typeof session.adminId !== "string" || !ObjectId.isValid(session.adminId)) return null;
    return session.adminId;
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
    const { name, email, phone, role, department, password, pumpId } = body;

    if (!name || !email || !phone || !role || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (pumpId && !ObjectId.isValid(pumpId)) {
      return NextResponse.json({ error: "Invalid pumpId" }, { status: 400 });
    }

    const employee = await createEmployee(
      {
        name,
        email,
        phone,
        role: role as "employee" | "pump-manager" | "security-guard",
        department,
        pumpId: pumpId ? new ObjectId(pumpId) : undefined,
        status: "active",
        passwordHash: hashPassword(password),
      },
      adminId
    );

    if (!employee) {
      return NextResponse.json(
        { error: "Failed to create employee" },
        { status: 400 }
      );
    }

    const { passwordHash, ...safeEmployee } = employee;
    return NextResponse.json(
      { success: true, employee: safeEmployee },
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

    const employees = await getAllEmployees();
    const safeEmployees = employees.map(e => {
      const { passwordHash, ...safe } = e;
      return safe;
    });
    return NextResponse.json({ success: true, employees: safeEmployees });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
