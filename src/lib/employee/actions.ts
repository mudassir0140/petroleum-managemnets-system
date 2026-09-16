"use server";

import { cookies } from "next/headers";
import type { EmployeeInvitation, SignupRequest, EmployeeAccount } from "./types";

const INVITATIONS_COOKIE = "petromanage_invitations";
const SIGNUP_REQUESTS_COOKIE = "petromanage_signup_requests";
const EMPLOYEES_COOKIE = "petromanage_employees";

// Load invitations from cookie storage
function loadInvitations(): EmployeeInvitation[] {
  try {
    const cookieStore = require("next/headers").cookies;
    const raw = cookieStore.get(INVITATIONS_COOKIE)?.value;
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Save invitations to cookie storage
async function saveInvitations(invitations: EmployeeInvitation[]): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(INVITATIONS_COOKIE, JSON.stringify(invitations), {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  });
}

// Load signup requests
async function loadSignupRequests(): Promise<SignupRequest[]> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(SIGNUP_REQUESTS_COOKIE)?.value;
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Save signup requests
async function saveSignupRequests(requests: SignupRequest[]): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SIGNUP_REQUESTS_COOKIE, JSON.stringify(requests), {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}

// Load employees
async function loadEmployees(): Promise<EmployeeAccount[]> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(EMPLOYEES_COOKIE)?.value;
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Save employees
async function saveEmployees(employees: EmployeeAccount[]): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(EMPLOYEES_COOKIE, JSON.stringify(employees), {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}

// Company Owner: Add employee invitation
export async function inviteEmployee(
  name: string,
  email: string,
  phone: string,
  role: string,
  ownerId: string
): Promise<{ success: boolean; error?: string; invitationId?: string }> {
  try {
    const invitations = loadInvitations();

    // Check if email already invited
    if (invitations.some((i) => i.email === email)) {
      return { success: false, error: "Email already invited" };
    }

    const invitation: EmployeeInvitation = {
      id: `INV-${Date.now()}`,
      name,
      email,
      phone,
      role,
      createdAt: new Date().toISOString(),
      createdBy: ownerId,
    };

    invitations.push(invitation);
    await saveInvitations(invitations);

    return { success: true, invitationId: invitation.id };
  } catch (error) {
    return { success: false, error: "Failed to create invitation" };
  }
}

// Find invitation by email
export async function findInvitationByEmail(email: string): Promise<EmployeeInvitation | null> {
  const invitations = loadInvitations();
  return invitations.find((i) => i.email === email) ?? null;
}

// Employee: Create signup request
export async function createSignupRequest(
  email: string,
  role: string
): Promise<{ success: boolean; error?: string; requestId?: string }> {
  try {
    const invitation = loadInvitations().find((i) => i.email === email);

    if (!invitation) {
      return { success: false, error: "Email not found in invitations" };
    }

    if (invitation.role !== role) {
      return { success: false, error: "Role mismatch" };
    }

    // Check if already has pending/approved request
    const requests = await loadSignupRequests();
    const existing = requests.find((r) => r.email === email);
    if (existing && existing.status !== "rejected") {
      return { success: false, error: "Signup request already exists" };
    }

    const request: SignupRequest = {
      id: `REQ-${Date.now()}`,
      invitationId: invitation.id,
      email,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    requests.push(request);
    await saveSignupRequests(requests);

    return { success: true, requestId: request.id };
  } catch (error) {
    return { success: false, error: "Failed to create signup request" };
  }
}

// Get all pending signup requests for admin
export async function getPendingSignupRequests(): Promise<
  (SignupRequest & { invitation: EmployeeInvitation })[]
> {
  try {
    const requests = await loadSignupRequests();
    const invitations = loadInvitations();

    return requests
      .filter((r) => r.status === "pending")
      .map((r) => ({
        ...r,
        invitation: invitations.find((i) => i.id === r.invitationId)!,
      }))
      .filter((r) => r.invitation);
  } catch {
    return [];
  }
}

// Admin: Approve signup request
export async function approveSignupRequest(
  requestId: string,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const requests = await loadSignupRequests();
    const request = requests.find((r) => r.id === requestId);

    if (!request) {
      return { success: false, error: "Request not found" };
    }

    request.status = "approved";
    request.approvedAt = new Date().toISOString();
    request.approvedBy = adminId;

    await saveSignupRequests(requests);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to approve request" };
  }
}

// Admin: Reject signup request
export async function rejectSignupRequest(
  requestId: string,
  adminId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const requests = await loadSignupRequests();
    const request = requests.find((r) => r.id === requestId);

    if (!request) {
      return { success: false, error: "Request not found" };
    }

    request.status = "rejected";
    request.approvedBy = adminId;
    if (reason) request.rejectionReason = reason;

    await saveSignupRequests(requests);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to reject request" };
  }
}

// Check signup request status
export async function checkSignupStatus(email: string): Promise<{
  status: "not-invited" | "pending" | "approved" | "rejected" | "active";
  message?: string;
}> {
  try {
    const invitation = loadInvitations().find((i) => i.email === email);
    if (!invitation) {
      return { status: "not-invited", message: "Email not found in invitations" };
    }

    const requests = await loadSignupRequests();
    const request = requests.find((r) => r.email === email);

    if (!request) {
      return { status: "pending", message: "Ready to signup" };
    }

    if (request.status === "rejected") {
      return { status: "rejected", message: request.rejectionReason || "Request was rejected" };
    }

    if (request.status === "pending") {
      return { status: "pending", message: "Waiting for admin approval" };
    }

    // Check if account is active
    const employees = await loadEmployees();
    const employee = employees.find((e) => e.email === email);

    if (employee && employee.status === "active") {
      return { status: "active", message: "Account active" };
    }

    return { status: "approved", message: "Approved by admin" };
  } catch {
    return { status: "not-invited" };
  }
}

// Create employee account after approval
export async function createEmployeeAccount(
  requestId: string,
  passwordHash: string
): Promise<{ success: boolean; error?: string; accountId?: string }> {
  try {
    const requests = await loadSignupRequests();
    const request = requests.find((r) => r.id === requestId);

    if (!request || request.status !== "approved") {
      return { success: false, error: "Request not approved" };
    }

    const invitation = loadInvitations().find((i) => i.id === request.invitationId);
    if (!invitation) {
      return { success: false, error: "Invitation not found" };
    }

    const employees = await loadEmployees();

    // Check if account already exists
    if (employees.some((e) => e.email === invitation.email)) {
      return { success: false, error: "Account already exists" };
    }

    const account: EmployeeAccount = {
      id: `EMP-${Date.now()}`,
      name: invitation.name,
      email: invitation.email,
      phone: invitation.phone,
      role: invitation.role,
      passwordHash,
      signupRequestId: requestId,
      status: "active",
      createdAt: new Date().toISOString(),
    };

    employees.push(account);
    await saveEmployees(employees);

    return { success: true, accountId: account.id };
  } catch (error) {
    return { success: false, error: "Failed to create account" };
  }
}

// Employee login
export async function employeeLogin(
  email: string,
  password: string
): Promise<{
  success: boolean;
  error?: string;
  employee?: EmployeeAccount;
  status?: "pending" | "rejected";
}> {
  try {
    // Check status first
    const statusCheck = await checkSignupStatus(email);

    if (statusCheck.status === "not-invited") {
      return { success: false, error: "Email not found in invitations" };
    }

    if (statusCheck.status === "pending") {
      return { success: false, error: "Your account is pending admin approval", status: "pending" };
    }

    if (statusCheck.status === "rejected") {
      return { success: false, error: statusCheck.message, status: "rejected" };
    }

    // Verify password
    const employees = await loadEmployees();
    const employee = employees.find((e) => e.email === email && e.status === "active");

    if (!employee) {
      return { success: false, error: "Invalid email or password" };
    }

    // In production, use proper password verification
    const { verifyPassword } = await import("@/lib/auth/password");
    const isValid = await verifyPassword(password, employee.passwordHash);

    if (!isValid) {
      return { success: false, error: "Invalid email or password" };
    }

    // Update last login
    employee.lastLogin = new Date().toISOString();
    await saveEmployees(employees);

    return { success: true, employee };
  } catch (error) {
    return { success: false, error: "Login failed" };
  }
}
