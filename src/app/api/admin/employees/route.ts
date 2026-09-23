import { NextRequest, NextResponse } from "next/server";
import { createEmployee, getAllEmployees, updateEmployee, deleteEmployee } from "@/lib/db/employee-service";
import { hashPassword } from "@/lib/auth/password";
import { isAssignableEmployeeRole } from "@/lib/roles";
import { resolveApiActor, actorHasRole } from "@/lib/admin/api-auth";
import { ObjectId } from "mongodb";

// Matches DASHBOARD_NAV's roles for /dashboard/hr/employees (nav.ts) —
// Admin always passes too (see actorHasRole). This is the page these
// routes exist for, so an HR Manager needs the same read/write access
// Admin has, not just Admin — a company-owner-or-hr-manager-only page
// whose own API 401s them is broken in practice, not just in theory.
const ALLOWED_ROLES = ["company-owner", "hr-manager"] as const;

export async function POST(request: NextRequest) {
  try {
    const actor = await resolveApiActor();
    if (!actorHasRole(actor, ALLOWED_ROLES)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const adminId = actor!.id;

    const body = await request.json();
    const { name, email, phone, role, department, password, pumpId } = body;

    if (!name || !email || !phone || !role || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!isAssignableEmployeeRole(role)) {
      return NextResponse.json(
        { error: "Invalid role selected" },
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
        role,
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
    const actor = await resolveApiActor();
    if (!actorHasRole(actor, ALLOWED_ROLES)) {
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

// Resets an employee's login password — same shape as the pumps PUT route
// (see src/app/api/admin/pumps/route.ts), just scoped to password since
// status already has its own dedicated route (employees/status).
export async function PUT(request: NextRequest) {
  try {
    const actor = await resolveApiActor();
    if (!actorHasRole(actor, ALLOWED_ROLES)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { employeeId, password } = await request.json();
    if (!employeeId || !ObjectId.isValid(employeeId)) {
      return NextResponse.json({ error: "Missing or invalid employeeId" }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    const employee = await updateEmployee(employeeId, { passwordHash: hashPassword(password) });
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const { passwordHash, ...safeEmployee } = employee;
    return NextResponse.json({ success: true, employee: safeEmployee });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Deleting the employee document also deletes their login (email/
// passwordHash/role live on the same record), so those credentials stop
// working immediately — same single-source-of-truth pattern as deleting a
// pump (see DELETE in src/app/api/admin/pumps/route.ts).
export async function DELETE(request: NextRequest) {
  try {
    const actor = await resolveApiActor();
    if (!actorHasRole(actor, ALLOWED_ROLES)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employeeId = request.nextUrl.searchParams.get("employeeId");
    if (!employeeId || !ObjectId.isValid(employeeId)) {
      return NextResponse.json({ error: "Missing or invalid employeeId" }, { status: 400 });
    }

    const deleted = await deleteEmployee(employeeId);
    if (!deleted) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
