// @ts-nocheck
export type UserStatus = "Active" | "Disabled" | "Locked";

export type SystemUser = {
  id: string;
  name: string;
  email: string;
  roleLabel: string;
  status: UserStatus;
  lastLogin: string;
  createdOn: string;
};

export const SYSTEM_USERS: SystemUser[] = [];

export type AuditLogEntry = {
  id: string;
  userName: string;
  action: string;
  timestamp: string;
};

export const AUDIT_LOG: AuditLogEntry[] = [];
