// @ts-nocheck
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

export const INTEGRATIONS: Integration[] = [];

export const SYSTEM_LOGS: unknown[] = [];
