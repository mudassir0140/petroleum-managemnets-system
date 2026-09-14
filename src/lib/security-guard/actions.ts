"use server";

import { revalidatePath } from "next/cache";
import { getSecurityGuardSession } from "@/lib/security-guard/session";
import {
  ActivityError,
  DutyError,
  checkInVisitor,
  checkOutVisitor,
  endDuty,
  logVehicleEntry,
  logVehicleExit,
  recordCheck,
  recordIncident,
  startDuty,
  submitIssueReport,
} from "@/lib/security-guard/activity-store";
import { SECURITY_CHECKPOINTS } from "@/lib/security-guard/types";
import type { GuardActionState } from "@/lib/security-guard/auth-state";
import type { CheckpointStatus, IncidentSeverity, IssueUrgency, VehicleType } from "@/lib/security-guard/types";

const DASHBOARD_PATH = "/security-guard/dashboard";

function readString(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

async function withGuardError(action: () => void): Promise<GuardActionState> {
  try {
    action();
  } catch (err) {
    if (err instanceof DutyError || err instanceof ActivityError) return { error: err.message };
    throw err;
  }
  return { success: true };
}

export async function startDutyAction(): Promise<void> {
  const session = await getSecurityGuardSession();
  startDuty(session.guardId, session.pumpId, session.assignedShift);
  revalidatePath(DASHBOARD_PATH);
}

export async function endDutyAction(_prevState: GuardActionState | undefined, formData: FormData): Promise<GuardActionState> {
  const session = await getSecurityGuardSession();
  const handoverNotes = readString(formData, "handoverNotes");

  const result = await withGuardError(() => endDuty({ guardId: session.guardId, handoverNotes }));
  revalidatePath(DASHBOARD_PATH);
  return result;
}

export async function recordCheckAction(_prevState: GuardActionState | undefined, formData: FormData): Promise<GuardActionState> {
  const session = await getSecurityGuardSession();
  const checkpoint = readString(formData, "checkpoint");
  const status = readString(formData, "status") as CheckpointStatus;
  const notes = readString(formData, "notes");

  if (!SECURITY_CHECKPOINTS.includes(checkpoint as (typeof SECURITY_CHECKPOINTS)[number])) {
    return { error: "Select a valid checkpoint." };
  }
  if (status !== "ok" && status !== "issue") {
    return { error: "Select a status." };
  }
  if (status === "issue" && !notes.trim()) {
    return { error: "Describe the issue you found." };
  }

  const result = await withGuardError(() =>
    recordCheck({ guardId: session.guardId, checkpoint: checkpoint as (typeof SECURITY_CHECKPOINTS)[number], status, notes }),
  );
  revalidatePath(`${DASHBOARD_PATH}/monitor`);
  revalidatePath(DASHBOARD_PATH);
  return result;
}

export async function checkInVisitorAction(_prevState: GuardActionState | undefined, formData: FormData): Promise<GuardActionState> {
  const session = await getSecurityGuardSession();
  const visitorName = readString(formData, "visitorName");
  const purpose = readString(formData, "purpose");
  const personToMeet = readString(formData, "personToMeet");
  const idNumber = readString(formData, "idNumber");

  if (!visitorName.trim()) return { error: "Enter the visitor's name." };
  if (!purpose.trim()) return { error: "Enter the purpose of visit." };

  checkInVisitor({ guardId: session.guardId, pumpId: session.pumpId, visitorName, purpose, personToMeet, idNumber });
  revalidatePath(`${DASHBOARD_PATH}/visitors`);
  revalidatePath(DASHBOARD_PATH);
  return { success: true };
}

export async function checkOutVisitorAction(formData: FormData): Promise<void> {
  const session = await getSecurityGuardSession();
  const visitorId = readString(formData, "visitorId");
  try {
    checkOutVisitor(session.guardId, visitorId);
  } catch (err) {
    if (!(err instanceof ActivityError)) throw err;
  }
  revalidatePath(`${DASHBOARD_PATH}/visitors`);
  revalidatePath(DASHBOARD_PATH);
}

export async function logVehicleEntryAction(_prevState: GuardActionState | undefined, formData: FormData): Promise<GuardActionState> {
  const session = await getSecurityGuardSession();
  const regNumber = readString(formData, "regNumber");
  const vehicleType = readString(formData, "vehicleType") as VehicleType;
  const driverName = readString(formData, "driverName");
  const purpose = readString(formData, "purpose");

  if (!regNumber.trim()) return { error: "Enter the vehicle registration number." };
  const validTypes: VehicleType[] = ["car", "motorcycle", "delivery_van", "fuel_tanker", "other"];
  if (!validTypes.includes(vehicleType)) return { error: "Select a vehicle type." };

  logVehicleEntry({ guardId: session.guardId, pumpId: session.pumpId, regNumber, vehicleType, driverName, purpose });
  revalidatePath(`${DASHBOARD_PATH}/vehicles`);
  revalidatePath(DASHBOARD_PATH);
  return { success: true };
}

export async function logVehicleExitAction(formData: FormData): Promise<void> {
  const session = await getSecurityGuardSession();
  const vehicleId = readString(formData, "vehicleId");
  try {
    logVehicleExit(session.guardId, vehicleId);
  } catch (err) {
    if (!(err instanceof ActivityError)) throw err;
  }
  revalidatePath(`${DASHBOARD_PATH}/vehicles`);
  revalidatePath(DASHBOARD_PATH);
}

export async function recordIncidentAction(_prevState: GuardActionState | undefined, formData: FormData): Promise<GuardActionState> {
  const session = await getSecurityGuardSession();
  const title = readString(formData, "title");
  const description = readString(formData, "description");
  const location = readString(formData, "location");
  const severity = readString(formData, "severity") as IncidentSeverity;

  if (!title.trim()) return { error: "Enter a short incident title." };
  if (!description.trim()) return { error: "Describe what happened." };
  const validSeverities: IncidentSeverity[] = ["low", "medium", "high", "critical"];
  if (!validSeverities.includes(severity)) return { error: "Select a severity." };

  recordIncident({ guardId: session.guardId, pumpId: session.pumpId, title, description, location, severity });
  revalidatePath(`${DASHBOARD_PATH}/incidents`);
  revalidatePath(DASHBOARD_PATH);
  return { success: true };
}

export async function submitIssueReportAction(_prevState: GuardActionState | undefined, formData: FormData): Promise<GuardActionState> {
  const session = await getSecurityGuardSession();
  const subject = readString(formData, "subject");
  const description = readString(formData, "description");
  const urgency = readString(formData, "urgency") as IssueUrgency;

  if (!subject.trim()) return { error: "Enter a subject for this report." };
  if (!description.trim()) return { error: "Describe the security issue." };
  const validUrgencies: IssueUrgency[] = ["low", "medium", "high"];
  if (!validUrgencies.includes(urgency)) return { error: "Select an urgency level." };

  submitIssueReport({ guardId: session.guardId, pumpId: session.pumpId, subject, description, urgency });
  revalidatePath(`${DASHBOARD_PATH}/report-issue`);
  revalidatePath(DASHBOARD_PATH);
  return { success: true };
}
