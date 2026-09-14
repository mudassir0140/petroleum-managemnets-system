import type { FuelType } from "@/lib/dashboard/data/stations";
import { PUMPS, pumpById, type Pump } from "@/lib/dashboard/data/pumps";

// Every helper below is scoped to this fixed list of pump ids — a
// Maintenance Technician page never accepts a pump id from a prop, query
// param or client input for deciding *what's visible*, so the technician can
// only ever see dispensers, issues, repairs and schedules for pumps they're
// actually assigned to.
export const ASSIGNED_PUMP_IDS = ["PUMP-02", "PUMP-04"];

export const TECHNICIAN = {
  id: "MTECH-01",
  name: "Kashif Rasheed",
  title: "Maintenance Technician",
  pumpIds: ASSIGNED_PUMP_IDS,
};

export function isAssignedPump(pumpId: string): boolean {
  return ASSIGNED_PUMP_IDS.includes(pumpId);
}

export function assignedPumps(): Pump[] {
  return PUMPS.filter((p) => isAssignedPump(p.id));
}

export function pumpLabel(pumpId: string): string {
  const pump = pumpById(pumpId);
  return pump ? `${pump.name} (Pump ${pump.number})` : pumpId;
}

export type DispenserStatus = "Operational" | "Needs Service" | "Under Repair" | "Out of Service";

export type Dispenser = {
  id: string;
  pumpId: string;
  label: string;
  fuelType: FuelType;
  status: DispenserStatus;
  lastServicedOn: string;
  nextServiceDue: string;
};

export const DISPENSERS: Dispenser[] = [
  { id: "DSP-021", pumpId: "PUMP-02", label: "Dispenser 1", fuelType: "petrol", status: "Operational", lastServicedOn: "2026-07-15", nextServiceDue: "2026-10-15" },
  { id: "DSP-022", pumpId: "PUMP-02", label: "Dispenser 2", fuelType: "diesel", status: "Needs Service", lastServicedOn: "2026-06-02", nextServiceDue: "2026-09-02" },
  { id: "DSP-023", pumpId: "PUMP-02", label: "Dispenser 3", fuelType: "hi-octane", status: "Operational", lastServicedOn: "2026-08-01", nextServiceDue: "2026-11-01" },
  { id: "DSP-041", pumpId: "PUMP-04", label: "Dispenser 1", fuelType: "diesel", status: "Under Repair", lastServicedOn: "2026-05-20", nextServiceDue: "2026-08-20" },
  { id: "DSP-042", pumpId: "PUMP-04", label: "Dispenser 2", fuelType: "petrol", status: "Needs Service", lastServicedOn: "2026-05-20", nextServiceDue: "2026-08-20" },
];

export function dispensersForPump(pumpId: string): Dispenser[] {
  return DISPENSERS.filter((d) => d.pumpId === pumpId);
}

export type IssueSeverity = "Low" | "Medium" | "High" | "Critical";
export type IssueStatus = "Open" | "Acknowledged" | "Resolved";

export type MaintenanceIssue = {
  id: string;
  pumpId: string;
  dispenserId: string | null;
  title: string;
  description: string;
  severity: IssueSeverity;
  status: IssueStatus;
  reportedBy: string;
  reportedOn: string;
  resolvedOn: string | null;
};

export const MAINTENANCE_ISSUES: MaintenanceIssue[] = [
  {
    id: "ISS-01",
    pumpId: "PUMP-04",
    dispenserId: "DSP-041",
    title: "Diesel dispenser leaking at nozzle",
    description: "Customers reported fuel dripping from the nozzle after a sale completes. Likely a worn seal.",
    severity: "High",
    status: "Open",
    reportedBy: TECHNICIAN.name,
    reportedOn: "2026-09-10",
    resolvedOn: null,
  },
  {
    id: "ISS-02",
    pumpId: "PUMP-02",
    dispenserId: "DSP-022",
    title: "Diesel dispenser display flickering",
    description: "The digital price/volume display flickers intermittently, making readings hard to verify.",
    severity: "Medium",
    status: "Acknowledged",
    reportedBy: TECHNICIAN.name,
    reportedOn: "2026-09-05",
    resolvedOn: null,
  },
];

export function issuesForPump(pumpId: string): MaintenanceIssue[] {
  return MAINTENANCE_ISSUES.filter((i) => i.pumpId === pumpId);
}

export type RepairStatus = "Pending" | "In Progress" | "Completed" | "Cancelled";

export type RepairTicket = {
  id: string;
  issueId: string | null;
  pumpId: string;
  dispenserId: string | null;
  title: string;
  notes: string;
  status: RepairStatus;
  startedOn: string;
  completedOn: string | null;
};

export const REPAIR_TICKETS: RepairTicket[] = [
  {
    id: "REP-01",
    issueId: "ISS-02",
    pumpId: "PUMP-02",
    dispenserId: "DSP-022",
    title: "Replace dispenser display unit",
    notes: "Ordered a replacement display panel; awaiting delivery from the depot.",
    status: "In Progress",
    startedOn: "2026-09-06",
    completedOn: null,
  },
  {
    id: "REP-02",
    issueId: null,
    pumpId: "PUMP-02",
    dispenserId: "DSP-023",
    title: "Routine nozzle calibration",
    notes: "Calibrated flow meter and verified accuracy within tolerance.",
    status: "Completed",
    startedOn: "2026-08-01",
    completedOn: "2026-08-01",
  },
];

export type ScheduledTaskStatus = "Scheduled" | "In Progress" | "Completed" | "Missed";

export type ScheduledTask = {
  id: string;
  pumpId: string;
  dispenserId: string | null;
  title: string;
  notes: string;
  scheduledDate: string;
  status: ScheduledTaskStatus;
};

export const SCHEDULED_TASKS: ScheduledTask[] = [
  {
    id: "TASK-01",
    pumpId: "PUMP-02",
    dispenserId: null,
    title: "Quarterly dispenser calibration check",
    notes: "Check all 3 dispensers for flow accuracy and reseal where needed.",
    scheduledDate: "2026-10-01",
    status: "Scheduled",
  },
  {
    id: "TASK-02",
    pumpId: "PUMP-04",
    dispenserId: "DSP-041",
    title: "Repair diesel dispenser nozzle leak",
    notes: "Bring a replacement nozzle seal kit from the depot.",
    scheduledDate: "2026-09-16",
    status: "Scheduled",
  },
];
