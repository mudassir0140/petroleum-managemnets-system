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

export const SYSTEM_USERS: SystemUser[] = [
  { id: "USR-01", name: "Rasheed Anjum", email: "owner@petromanage.com", roleLabel: "Company Owner", status: "Active", lastLogin: "2026-09-11 08:12", createdOn: "2025-01-04" },
  { id: "USR-02", name: "Farah Iqbal", email: "manager@petromanage.com", roleLabel: "Company Manager", status: "Active", lastLogin: "2026-09-11 07:40", createdOn: "2025-02-11" },
  { id: "USR-03", name: "Olamide Fashola", email: "finance@petromanage.com", roleLabel: "Finance Manager", status: "Active", lastLogin: "2026-09-10 18:55", createdOn: "2025-03-02" },
  { id: "USR-04", name: "Sana Malik", email: "hr@petromanage.com", roleLabel: "HR Manager", status: "Active", lastLogin: "2026-09-10 17:20", createdOn: "2025-04-19" },
  { id: "USR-05", name: "Nasir Hussain", email: "depot@petromanage.com", roleLabel: "Fuel/Depot Manager", status: "Active", lastLogin: "2026-09-11 06:05", createdOn: "2025-05-27" },
  { id: "USR-06", name: "Imran Chaudhry", email: "imran.chaudhry@petromanage.com", roleLabel: "Company Manager", status: "Disabled", lastLogin: "2026-08-02 09:14", createdOn: "2025-06-08" },
  { id: "USR-07", name: "Zainab Qureshi", email: "zainab.qureshi@petromanage.com", roleLabel: "Finance Manager", status: "Locked", lastLogin: "2026-07-21 14:32", createdOn: "2025-07-15" },
  { id: "USR-08", name: "Bilal Aslam", email: "bilal.aslam@petromanage.com", roleLabel: "HR Manager", status: "Active", lastLogin: "2026-09-09 11:47", createdOn: "2025-08-30" },
  { id: "USR-09", name: "Tariq Javed", email: "it@petromanage.com", roleLabel: "IT/System Admin", status: "Active", lastLogin: "2026-09-11 08:00", createdOn: "2024-12-01" },
];

export type AuditAction = "Login" | "Logout" | "Password Reset" | "Role Changed" | "Account Disabled" | "Account Enabled";

export type AuditEntry = {
  id: string;
  userId: string;
  userName: string;
  action: AuditAction;
  device: string;
  ip: string;
  time: string;
};

export const AUDIT_LOG: AuditEntry[] = [
  { id: "AUD-501", userId: "USR-01", userName: "Rasheed Anjum", action: "Login", device: "Chrome · Windows", ip: "182.190.11.42", time: "2026-09-11 08:12" },
  { id: "AUD-500", userId: "USR-05", userName: "Nasir Hussain", action: "Login", device: "Edge · Windows", ip: "182.191.4.87", time: "2026-09-11 06:05" },
  { id: "AUD-499", userId: "USR-07", userName: "Zainab Qureshi", action: "Login", device: "Safari · macOS", ip: "39.42.101.9", time: "2026-07-21 14:30" },
  { id: "AUD-498", userId: "USR-07", userName: "Zainab Qureshi", action: "Account Disabled", device: "System", ip: "—", time: "2026-07-21 14:35" },
  { id: "AUD-497", userId: "USR-06", userName: "Imran Chaudhry", action: "Account Disabled", device: "System", ip: "—", time: "2026-08-02 09:20" },
  { id: "AUD-496", userId: "USR-08", userName: "Bilal Aslam", action: "Password Reset", device: "Chrome · Android", ip: "39.42.87.201", time: "2026-09-09 11:50" },
  { id: "AUD-495", userId: "USR-04", userName: "Sana Malik", action: "Login", device: "Chrome · Windows", ip: "182.190.55.13", time: "2026-09-10 17:20" },
  { id: "AUD-494", userId: "USR-03", userName: "Olamide Fashola", action: "Role Changed", device: "System", ip: "—", time: "2026-03-02 10:00" },
];
