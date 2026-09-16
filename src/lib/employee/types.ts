export interface EmployeeInvitation {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
  createdBy: string; // Owner ID
}

export interface SignupRequest {
  id: string;
  invitationId: string;
  email: string;
  password?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
}

export interface EmployeeAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  passwordHash: string;
  signupRequestId: string;
  status: "active" | "inactive";
  createdAt: string;
  lastLogin?: string;
}
