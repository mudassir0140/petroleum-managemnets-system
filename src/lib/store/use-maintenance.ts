"use client";

import {
  ASSIGNED_PUMP_IDS,
  DISPENSERS,
  MAINTENANCE_ISSUES,
  REPAIR_TICKETS,
  SCHEDULED_TASKS,
  TECHNICIAN,
  isAssignedPump,
  type Dispenser,
  type DispenserStatus,
  type IssueSeverity,
  type IssueStatus,
  type MaintenanceIssue,
  type RepairStatus,
  type RepairTicket,
  type ScheduledTask,
  type ScheduledTaskStatus,
} from "@/lib/dashboard/data/maintenance";
import { useSharedState } from "@/lib/store/shared-store";

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.round(Math.random() * 1000)}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Every read below is filtered to ASSIGNED_PUMP_IDS and every write validates
 * its pumpId against isAssignedPump() before touching state — a Maintenance
 * Technician page can only ever see and mutate records for pumps they're
 * actually assigned to, even though the underlying shared store holds every
 * pump's data (other portals write their own keys, not these).
 */
export function useMaintenance() {
  const [allDispensers, setDispensers] = useSharedState<Dispenser[]>("maintenance-dispensers", DISPENSERS);
  const [allIssues, setIssues] = useSharedState<MaintenanceIssue[]>("maintenance-issues", MAINTENANCE_ISSUES);
  const [allRepairs, setRepairs] = useSharedState<RepairTicket[]>("maintenance-repairs", REPAIR_TICKETS);
  const [allTasks, setTasks] = useSharedState<ScheduledTask[]>("maintenance-tasks", SCHEDULED_TASKS);

  const dispensers = allDispensers.filter((d) => isAssignedPump(d.pumpId));
  const issues = allIssues.filter((i) => isAssignedPump(i.pumpId));
  const repairs = allRepairs.filter((r) => isAssignedPump(r.pumpId));
  const tasks = allTasks.filter((t) => isAssignedPump(t.pumpId));

  function updateDispenserStatus(dispenserId: string, status: DispenserStatus) {
    setDispensers((prev) =>
      prev.map((d) => (d.id === dispenserId && isAssignedPump(d.pumpId) ? { ...d, status } : d)),
    );
  }

  function reportIssue(input: {
    pumpId: string;
    dispenserId: string | null;
    title: string;
    description: string;
    severity: IssueSeverity;
  }) {
    if (!isAssignedPump(input.pumpId) || !input.title.trim()) return null;

    const issue: MaintenanceIssue = {
      id: newId("ISS"),
      pumpId: input.pumpId,
      dispenserId: input.dispenserId,
      title: input.title.trim(),
      description: input.description.trim(),
      severity: input.severity,
      status: "Open",
      reportedBy: TECHNICIAN.name,
      reportedOn: todayIso(),
      resolvedOn: null,
    };
    setIssues((prev) => [issue, ...prev]);
    return issue;
  }

  function updateIssueStatus(issueId: string, status: IssueStatus) {
    setIssues((prev) =>
      prev.map((i) =>
        i.id === issueId && isAssignedPump(i.pumpId)
          ? { ...i, status, resolvedOn: status === "Resolved" ? todayIso() : null }
          : i,
      ),
    );
  }

  function startRepairFromIssue(issueId: string) {
    const issue = allIssues.find((i) => i.id === issueId);
    if (!issue || !isAssignedPump(issue.pumpId)) return null;

    const repair: RepairTicket = {
      id: newId("REP"),
      issueId: issue.id,
      pumpId: issue.pumpId,
      dispenserId: issue.dispenserId,
      title: issue.title,
      notes: "",
      status: "In Progress",
      startedOn: todayIso(),
      completedOn: null,
    };
    setRepairs((prev) => [repair, ...prev]);
    setIssues((prev) => prev.map((i) => (i.id === issueId ? { ...i, status: "Acknowledged" } : i)));
    return repair;
  }

  function createRepair(input: { pumpId: string; dispenserId: string | null; title: string; notes: string }) {
    if (!isAssignedPump(input.pumpId) || !input.title.trim()) return null;

    const repair: RepairTicket = {
      id: newId("REP"),
      issueId: null,
      pumpId: input.pumpId,
      dispenserId: input.dispenserId,
      title: input.title.trim(),
      notes: input.notes.trim(),
      status: "Pending",
      startedOn: todayIso(),
      completedOn: null,
    };
    setRepairs((prev) => [repair, ...prev]);
    return repair;
  }

  function updateRepairStatus(repairId: string, status: RepairStatus, notes?: string) {
    setRepairs((prev) =>
      prev.map((r) =>
        r.id === repairId && isAssignedPump(r.pumpId)
          ? {
              ...r,
              status,
              notes: notes !== undefined ? notes : r.notes,
              completedOn: status === "Completed" ? todayIso() : null,
            }
          : r,
      ),
    );

    const repair = allRepairs.find((r) => r.id === repairId);
    if (repair?.issueId && status === "Completed") {
      setIssues((prev) =>
        prev.map((i) => (i.id === repair.issueId ? { ...i, status: "Resolved", resolvedOn: todayIso() } : i)),
      );
    }
  }

  function scheduleTask(input: { pumpId: string; dispenserId: string | null; title: string; notes: string; scheduledDate: string }) {
    if (!isAssignedPump(input.pumpId) || !input.title.trim() || !input.scheduledDate) return null;

    const task: ScheduledTask = {
      id: newId("TASK"),
      pumpId: input.pumpId,
      dispenserId: input.dispenserId,
      title: input.title.trim(),
      notes: input.notes.trim(),
      scheduledDate: input.scheduledDate,
      status: "Scheduled",
    };
    setTasks((prev) => [task, ...prev]);
    return task;
  }

  function updateTaskStatus(taskId: string, status: ScheduledTaskStatus) {
    setTasks((prev) => prev.map((t) => (t.id === taskId && isAssignedPump(t.pumpId) ? { ...t, status } : t)));
  }

  return {
    assignedPumpIds: ASSIGNED_PUMP_IDS,
    dispensers,
    issues,
    repairs,
    tasks,
    updateDispenserStatus,
    reportIssue,
    updateIssueStatus,
    startRepairFromIssue,
    createRepair,
    updateRepairStatus,
    scheduleTask,
    updateTaskStatus,
  };
}
