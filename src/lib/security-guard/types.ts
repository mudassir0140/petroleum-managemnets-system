import type { Shift } from "@/lib/types";

export interface SecurityGuardAccount {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  username: string;
  pumpId: string;
  assignedShift: Shift;
  passwordHash: string;
  createdAt: string;
}

export interface SecurityGuardSession {
  guardId: string;
  guardName: string;
  guardEmail: string;
  pumpId: string;
  assignedShift: Shift;
  role: "security_guard";
}

export type DutyStatus = "on_duty" | "off_duty";

export interface DutyLog {
  id: string;
  guardId: string;
  pumpId: string;
  shift: Shift;
  date: string; // ISO date the duty was started on
  status: DutyStatus;
  startedAt: string;
  endedAt?: string;
  handoverNotes?: string;
}

export const SECURITY_CHECKPOINTS = [
  "CCTV Cameras",
  "Perimeter Fencing & Gates",
  "Fire Extinguishers",
  "Emergency Lighting",
  "Cash Office Lock",
  "Fuel Tank Access Points",
] as const;

export type SecurityCheckpoint = (typeof SECURITY_CHECKPOINTS)[number];
export type CheckpointStatus = "ok" | "issue";

export interface SecurityCheckEntry {
  id: string;
  dutyLogId: string;
  guardId: string;
  pumpId: string;
  checkpoint: SecurityCheckpoint;
  status: CheckpointStatus;
  notes: string;
  recordedAt: string;
}

export interface VisitorEntry {
  id: string;
  guardId: string;
  pumpId: string;
  visitorName: string;
  purpose: string;
  personToMeet: string;
  idNumber: string;
  checkedInAt: string;
  checkedOutAt?: string;
}

export type VehicleType = "car" | "motorcycle" | "delivery_van" | "fuel_tanker" | "other";

export interface VehicleLogEntry {
  id: string;
  guardId: string;
  pumpId: string;
  regNumber: string;
  vehicleType: VehicleType;
  driverName: string;
  purpose: string;
  enteredAt: string;
  exitedAt?: string;
}

export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export interface IncidentEntry {
  id: string;
  guardId: string;
  pumpId: string;
  title: string;
  description: string;
  location: string;
  severity: IncidentSeverity;
  occurredAt: string;
}

export type IssueUrgency = "low" | "medium" | "high";
export type IssueStatus = "open" | "acknowledged" | "resolved";

export interface SecurityIssueReport {
  id: string;
  guardId: string;
  pumpId: string;
  subject: string;
  description: string;
  urgency: IssueUrgency;
  status: IssueStatus;
  reportedAt: string;
}

export interface DailyActivitySummary {
  date: string;
  visitorsIn: number;
  visitorsOnSite: number;
  vehiclesIn: number;
  vehiclesOnSite: number;
  incidentsLogged: number;
  checksLogged: number;
  checkpointIssues: number;
  issueReportsOpen: number;
}
