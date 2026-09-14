import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";
import type {
  CheckpointStatus,
  DailyActivitySummary,
  DutyLog,
  IncidentEntry,
  IncidentSeverity,
  IssueUrgency,
  SecurityCheckEntry,
  SecurityCheckpoint,
  SecurityIssueReport,
  VehicleLogEntry,
  VehicleType,
  VisitorEntry,
} from "@/lib/security-guard/types";
import type { Shift } from "@/lib/types";

// File-backed ledger of duty lifecycle + all security activity logs.
// Everything here is read/written scoped to a single guardId — callers
// (Server Actions, pages) always derive guardId (and therefore pumpId, fixed
// per guard) from the verified session, never from client input, so a guard
// can only ever log and view activity for their own assigned pump.
interface StoreShape {
  dutyLogs: DutyLog[];
  checkEntries: SecurityCheckEntry[];
  visitorEntries: VisitorEntry[];
  vehicleEntries: VehicleLogEntry[];
  incidentEntries: IncidentEntry[];
  issueReports: SecurityIssueReport[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "security-activity.json");

function emptyStore(): StoreShape {
  return { dutyLogs: [], checkEntries: [], visitorEntries: [], vehicleEntries: [], incidentEntries: [], issueReports: [] };
}

function load(): StoreShape {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE_PATH)) {
    const seeded = emptyStore();
    fs.writeFileSync(FILE_PATH, JSON.stringify(seeded, null, 2), "utf8");
    return seeded;
  }
  try {
    const raw = fs.readFileSync(FILE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return {
      dutyLogs: Array.isArray(parsed.dutyLogs) ? parsed.dutyLogs : [],
      checkEntries: Array.isArray(parsed.checkEntries) ? parsed.checkEntries : [],
      visitorEntries: Array.isArray(parsed.visitorEntries) ? parsed.visitorEntries : [],
      vehicleEntries: Array.isArray(parsed.vehicleEntries) ? parsed.vehicleEntries : [],
      incidentEntries: Array.isArray(parsed.incidentEntries) ? parsed.incidentEntries : [],
      issueReports: Array.isArray(parsed.issueReports) ? parsed.issueReports : [],
    };
  } catch {
    return emptyStore();
  }
}

const store: StoreShape = load();

function persist() {
  fs.writeFileSync(FILE_PATH, JSON.stringify(store, null, 2), "utf8");
}

function generateId(prefix: string): string {
  return `${prefix}-${randomBytes(5).toString("hex")}`;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export class DutyError extends Error {}

// ---------------------------------------------------------------------------
// Duty lifecycle
// ---------------------------------------------------------------------------

export function getActiveDuty(guardId: string): DutyLog | null {
  return store.dutyLogs.find((d) => d.guardId === guardId && d.status === "on_duty") ?? null;
}

export function startDuty(guardId: string, pumpId: string, shift: Shift): DutyLog {
  const existing = getActiveDuty(guardId);
  if (existing) return existing;

  const log: DutyLog = {
    id: generateId("DUTY"),
    guardId,
    pumpId,
    shift,
    date: isoDate(new Date()),
    status: "on_duty",
    startedAt: new Date().toISOString(),
  };
  store.dutyLogs.push(log);
  persist();
  return log;
}

export interface EndDutyInput {
  guardId: string;
  handoverNotes: string;
}

export function endDuty(input: EndDutyInput): DutyLog {
  const duty = getActiveDuty(input.guardId);
  if (!duty) {
    throw new DutyError("There is no active duty shift to end.");
  }

  duty.status = "off_duty";
  duty.endedAt = new Date().toISOString();
  duty.handoverNotes = input.handoverNotes.trim();
  persist();
  return duty;
}

export function getDutyHistory(guardId: string, limit = 30): DutyLog[] {
  return store.dutyLogs
    .filter((d) => d.guardId === guardId)
    .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Pump security checkpoint rounds
// ---------------------------------------------------------------------------

export interface RecordCheckInput {
  guardId: string;
  checkpoint: SecurityCheckpoint;
  status: CheckpointStatus;
  notes: string;
}

export function recordCheck(input: RecordCheckInput): SecurityCheckEntry {
  const duty = getActiveDuty(input.guardId);
  if (!duty) {
    throw new DutyError("Start your duty shift before logging a security check.");
  }

  const entry: SecurityCheckEntry = {
    id: generateId("CHK"),
    dutyLogId: duty.id,
    guardId: input.guardId,
    pumpId: duty.pumpId,
    checkpoint: input.checkpoint,
    status: input.status,
    notes: input.notes.trim(),
    recordedAt: new Date().toISOString(),
  };
  store.checkEntries.push(entry);
  persist();
  return entry;
}

export function getTodayChecks(guardId: string): SecurityCheckEntry[] {
  const today = isoDate(new Date());
  return store.checkEntries
    .filter((c) => c.guardId === guardId && c.recordedAt.slice(0, 10) === today)
    .sort((a, b) => (a.recordedAt < b.recordedAt ? 1 : -1));
}

export function getCheckHistory(guardId: string, limit = 50): SecurityCheckEntry[] {
  return store.checkEntries
    .filter((c) => c.guardId === guardId)
    .sort((a, b) => (a.recordedAt < b.recordedAt ? 1 : -1))
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Visitor log
// ---------------------------------------------------------------------------

export interface CheckInVisitorInput {
  guardId: string;
  pumpId: string;
  visitorName: string;
  purpose: string;
  personToMeet: string;
  idNumber: string;
}

export function checkInVisitor(input: CheckInVisitorInput): VisitorEntry {
  const entry: VisitorEntry = {
    id: generateId("VIS"),
    guardId: input.guardId,
    pumpId: input.pumpId,
    visitorName: input.visitorName.trim(),
    purpose: input.purpose.trim(),
    personToMeet: input.personToMeet.trim(),
    idNumber: input.idNumber.trim(),
    checkedInAt: new Date().toISOString(),
  };
  store.visitorEntries.push(entry);
  persist();
  return entry;
}

export class ActivityError extends Error {}

export function checkOutVisitor(guardId: string, visitorId: string): VisitorEntry {
  const entry = store.visitorEntries.find((v) => v.id === visitorId && v.guardId === guardId);
  if (!entry) throw new ActivityError("Visitor entry not found.");
  if (entry.checkedOutAt) throw new ActivityError("Visitor has already checked out.");
  entry.checkedOutAt = new Date().toISOString();
  persist();
  return entry;
}

export function getVisitorsToday(guardId: string): VisitorEntry[] {
  const today = isoDate(new Date());
  return store.visitorEntries
    .filter((v) => v.guardId === guardId && v.checkedInAt.slice(0, 10) === today)
    .sort((a, b) => (a.checkedInAt < b.checkedInAt ? 1 : -1));
}

export function getVisitorHistory(guardId: string, limit = 50): VisitorEntry[] {
  return store.visitorEntries
    .filter((v) => v.guardId === guardId)
    .sort((a, b) => (a.checkedInAt < b.checkedInAt ? 1 : -1))
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Vehicle entry/exit log
// ---------------------------------------------------------------------------

export interface LogVehicleEntryInput {
  guardId: string;
  pumpId: string;
  regNumber: string;
  vehicleType: VehicleType;
  driverName: string;
  purpose: string;
}

export function logVehicleEntry(input: LogVehicleEntryInput): VehicleLogEntry {
  const entry: VehicleLogEntry = {
    id: generateId("VEH"),
    guardId: input.guardId,
    pumpId: input.pumpId,
    regNumber: input.regNumber.trim().toUpperCase(),
    vehicleType: input.vehicleType,
    driverName: input.driverName.trim(),
    purpose: input.purpose.trim(),
    enteredAt: new Date().toISOString(),
  };
  store.vehicleEntries.push(entry);
  persist();
  return entry;
}

export function logVehicleExit(guardId: string, vehicleId: string): VehicleLogEntry {
  const entry = store.vehicleEntries.find((v) => v.id === vehicleId && v.guardId === guardId);
  if (!entry) throw new ActivityError("Vehicle entry not found.");
  if (entry.exitedAt) throw new ActivityError("Vehicle has already exited.");
  entry.exitedAt = new Date().toISOString();
  persist();
  return entry;
}

export function getVehiclesToday(guardId: string): VehicleLogEntry[] {
  const today = isoDate(new Date());
  return store.vehicleEntries
    .filter((v) => v.guardId === guardId && v.enteredAt.slice(0, 10) === today)
    .sort((a, b) => (a.enteredAt < b.enteredAt ? 1 : -1));
}

export function getVehicleHistory(guardId: string, limit = 50): VehicleLogEntry[] {
  return store.vehicleEntries
    .filter((v) => v.guardId === guardId)
    .sort((a, b) => (a.enteredAt < b.enteredAt ? 1 : -1))
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Incidents
// ---------------------------------------------------------------------------

export interface RecordIncidentInput {
  guardId: string;
  pumpId: string;
  title: string;
  description: string;
  location: string;
  severity: IncidentSeverity;
}

export function recordIncident(input: RecordIncidentInput): IncidentEntry {
  const entry: IncidentEntry = {
    id: generateId("INC"),
    guardId: input.guardId,
    pumpId: input.pumpId,
    title: input.title.trim(),
    description: input.description.trim(),
    location: input.location.trim(),
    severity: input.severity,
    occurredAt: new Date().toISOString(),
  };
  store.incidentEntries.push(entry);
  persist();
  return entry;
}

export function getIncidents(guardId: string, limit = 50): IncidentEntry[] {
  return store.incidentEntries
    .filter((i) => i.guardId === guardId)
    .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1))
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Security issue reports (to management)
// ---------------------------------------------------------------------------

export interface SubmitIssueReportInput {
  guardId: string;
  pumpId: string;
  subject: string;
  description: string;
  urgency: IssueUrgency;
}

export function submitIssueReport(input: SubmitIssueReportInput): SecurityIssueReport {
  const report: SecurityIssueReport = {
    id: generateId("ISS"),
    guardId: input.guardId,
    pumpId: input.pumpId,
    subject: input.subject.trim(),
    description: input.description.trim(),
    urgency: input.urgency,
    status: "open",
    reportedAt: new Date().toISOString(),
  };
  store.issueReports.push(report);
  persist();
  return report;
}

export function getIssueReports(guardId: string, limit = 50): SecurityIssueReport[] {
  return store.issueReports
    .filter((r) => r.guardId === guardId)
    .sort((a, b) => (a.reportedAt < b.reportedAt ? 1 : -1))
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Daily activity summary
// ---------------------------------------------------------------------------

export function getDailyActivitySummary(guardId: string): DailyActivitySummary {
  const today = isoDate(new Date());
  const visitorsToday = getVisitorsToday(guardId);
  const vehiclesToday = getVehiclesToday(guardId);

  return {
    date: today,
    visitorsIn: visitorsToday.length,
    visitorsOnSite: visitorsToday.filter((v) => !v.checkedOutAt).length,
    vehiclesIn: vehiclesToday.length,
    vehiclesOnSite: vehiclesToday.filter((v) => !v.exitedAt).length,
    incidentsLogged: store.incidentEntries.filter((i) => i.guardId === guardId && i.occurredAt.slice(0, 10) === today).length,
    checksLogged: getTodayChecks(guardId).length,
    checkpointIssues: getTodayChecks(guardId).filter((c) => c.status === "issue").length,
    issueReportsOpen: store.issueReports.filter((r) => r.guardId === guardId && r.status === "open").length,
  };
}
