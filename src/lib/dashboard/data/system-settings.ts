export type SystemSettings = {
  maintenanceMode: boolean;
  sessionTimeoutMinutes: number;
  passwordMinLength: number;
  requireTwoFactor: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  backupFrequency: "Daily" | "Weekly" | "Monthly";
  dataRetentionDays: number;
  timezone: string;
  defaultCurrency: string;
};

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  maintenanceMode: false,
  sessionTimeoutMinutes: 30,
  passwordMinLength: 8,
  requireTwoFactor: true,
  emailNotifications: true,
  smsNotifications: false,
  backupFrequency: "Daily",
  dataRetentionDays: 365,
  timezone: "Asia/Karachi (PKT, UTC+5)",
  defaultCurrency: "PKR (Rs.)",
};

export type IntegrationStatus = "Connected" | "Not Connected" | "Error";

export type Integration = {
  id: string;
  name: string;
  description: string;
  status: IntegrationStatus;
  lastSync: string | null;
};

export const INTEGRATIONS: Integration[] = [
  { id: "INT-01", name: "SMS Gateway", description: "OTP and alert delivery via Telenor SMS API", status: "Connected", lastSync: "2026-09-11 08:00" },
  { id: "INT-02", name: "Email Service", description: "Transactional email via company SMTP relay", status: "Connected", lastSync: "2026-09-11 07:50" },
  { id: "INT-03", name: "Payment Gateway", description: "Bank transfer reconciliation feed", status: "Connected", lastSync: "2026-09-10 22:15" },
  { id: "INT-04", name: "Backup Storage", description: "Nightly encrypted backup to cloud storage", status: "Connected", lastSync: "2026-09-11 02:00" },
  { id: "INT-05", name: "Fleet GPS Provider", description: "Live tanker GPS feed", status: "Error", lastSync: "2026-09-08 14:20" },
];

export type SystemLog = {
  id: string;
  level: "Info" | "Warning" | "Error";
  message: string;
  time: string;
};

export const SYSTEM_LOGS: SystemLog[] = [
  { id: "LOG-901", level: "Info", message: "Nightly backup completed successfully (4.2 GB)", time: "2026-09-11 02:00" },
  { id: "LOG-900", level: "Error", message: "Fleet GPS Provider sync failed — connection timeout", time: "2026-09-08 14:20" },
  { id: "LOG-899", level: "Warning", message: "Session timeout reduced from 60 to 30 minutes by admin", time: "2026-09-05 10:12" },
  { id: "LOG-898", level: "Info", message: "Password policy updated — minimum length set to 8", time: "2026-09-02 09:30" },
  { id: "LOG-897", level: "Info", message: "System update deployed — v2.4.1", time: "2026-08-28 03:00" },
];
