import { NextRequest, NextResponse } from "next/server";
import { createEmployee, getAllEmployees, deleteEmployee, generateEmployeeId } from "@/lib/db/employees";
import { createUser } from "@/lib/db/users";
import { initializeDatabase } from "@/lib/db/init";

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();

    const body = await request.json();
    const { name, email, phone, role, password } = body;

    if (!name || !email || !phone || !role || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const employeeId = await generateEmployeeId();
    const now = new Date().toISOString();

    const employee = await createEmployee({
      employeeId,
      name,
      email,
      phone,
      role,
      createdAt: now,
      updatedAt: now,
    });

    // Create user account for employee
    await createUser({
      email,
      passwordHash: password,
      role: "employee",
      employeeId,
      approvalStatus: "approved",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json(
      { success: true, employee, message: "Employee created successfully" },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[API] Employee creation error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    await initializeDatabase();
    const employees = await getAllEmployees();
    return NextResponse.json({ success: true, employees }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[API] Get employees error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await initializeDatabase();

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");

    if (!employeeId) {
      return NextResponse.json(
        { error: "employeeId is required" },
        { status: 400 }
      );
    }

    const success = await deleteEmployee(employeeId);

    if (!success) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Employee deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[API] Employee deletion error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
