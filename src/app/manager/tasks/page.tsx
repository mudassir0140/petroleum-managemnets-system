"use client";

import { useState } from "react";
import {
  AlertTriangleIcon,
  ClipboardIcon,
  PlusIcon,
  XCircleIcon,
} from "@/components/icons";
import { AlertSeverityBadge, PriorityBadge } from "@/components/ops/badge";
import { FormField, inputClass, Modal } from "@/components/ops/modal";
import { PageHeader } from "@/components/ops/page-header";
import { SectionCard } from "@/components/ops/section-card";
import { StatCard } from "@/components/ops/stat-card";
import { EMPLOYEES, employeeById } from "@/lib/data/employees";
import { pumpById, PUMPS } from "@/lib/data/pumps";
import { useAlerts, useTasks } from "@/lib/store/use-tasks";
import type { ManagerTask, TaskPriority, TaskStatus } from "@/lib/manager/types";

const COLUMNS: { status: TaskStatus; label: string; next?: TaskStatus; nextLabel?: string }[] = [
  { status: "todo", label: "To Do", next: "in-progress", nextLabel: "Assign" },
  { status: "in-progress", label: "In Progress", next: "verify", nextLabel: "Track → Verify" },
  { status: "verify", label: "Verify", next: "done", nextLabel: "Complete" },
  { status: "done", label: "Done" },
];

const ALERT_TYPE_LABEL: Record<string, string> = {
  "low-stock": "Low stock",
  "delayed-tanker": "Delayed tanker",
  "payment-overdue": "Payment overdue",
  "pending-delivery": "Pending delivery",
  complaint: "Complaint",
  "leave-request": "Leave request",
};

export default function TasksAlertsPage() {
  const { tasks, addTask, updateTaskStatus } = useTasks();
  const { alerts, dismissAlert } = useAlerts();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    assigneeId: EMPLOYEES[0]?.id ?? "",
    pumpId: "",
    priority: "medium" as TaskPriority,
    dueDate: "Today",
  });

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const assignee = employeeById(form.assigneeId);
    const task: ManagerTask = {
      id: `tsk-${Date.now()}`,
      title: form.title,
      description: form.description,
      assigneeId: form.assigneeId,
      assigneeName: assignee?.name ?? "Unassigned",
      pumpId: form.pumpId || null,
      priority: form.priority,
      status: "todo",
      dueDate: form.dueDate,
      createdOn: "Today",
    };
    addTask(task);
    setCreateOpen(false);
    setForm({ title: "", description: "", assigneeId: EMPLOYEES[0]?.id ?? "", pumpId: "", priority: "medium", dueDate: "Today" });
  }

  const pendingCount = tasks.filter((t) => t.status !== "done").length;
  const highPriorityCount = tasks.filter((t) => t.priority === "high" && t.status !== "done").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks & Alerts"
        description="Create, assign, track, verify and complete operational tasks across the network."
        actions={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            <PlusIcon className="size-4" />
            Create task
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Pending tasks" value={String(pendingCount)} icon={ClipboardIcon} tone="amber" />
        <StatCard label="High priority" value={String(highPriorityCount)} icon={ClipboardIcon} tone="rose" />
        <StatCard label="Active alerts" value={String(alerts.length)} icon={AlertTriangleIcon} tone="purple" />
      </div>

      <SectionCard title="Operational alerts" description="Low stock, delayed tankers, overdue payments and more">
        {alerts.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No active alerts.</p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((alert) => {
              const pump = pumpById(alert.pumpId);
              return (
                <li
                  key={alert.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 p-3.5 dark:border-slate-800"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-amber-500" />
                    <div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{alert.message}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <AlertSeverityBadge severity={alert.severity} />
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          {ALERT_TYPE_LABEL[alert.type] ?? alert.type}
                        </span>
                        {pump && (
                          <span className="text-[11px] text-slate-400">{pump.name}</span>
                        )}
                        <span className="text-[11px] text-slate-400">{alert.createdAt}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => dismissAlert(alert.id)}
                    aria-label="Dismiss alert"
                    className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                  >
                    <XCircleIcon className="size-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
          Create → Assign → Track → Verify → Complete
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((column) => {
            const columnTasks = tasks.filter((t) => t.status === column.status);
            return (
              <div
                key={column.status}
                className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {column.label}
                  </p>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {columnTasks.length}
                  </span>
                </div>
                <div className="space-y-3 p-3">
                  {columnTasks.map((task) => {
                    const pump = pumpById(task.pumpId);
                    return (
                      <div
                        key={task.id}
                        className="rounded-xl border border-slate-100 p-3 dark:border-slate-800"
                      >
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {task.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {task.description}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <PriorityBadge priority={task.priority} />
                          {pump && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                              {pump.code}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-[11px] text-slate-400">
                          {task.assigneeName} · Due {task.dueDate}
                        </p>
                        {column.next && (
                          <button
                            type="button"
                            onClick={() => updateTaskStatus(task.id, column.next!)}
                            className="mt-2.5 w-full rounded-lg border border-slate-200 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            {column.nextLabel}
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {columnTasks.length === 0 && (
                    <p className="px-1 py-4 text-center text-xs text-slate-400">No tasks</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create task"
        description="Assign an operational task to a team member"
        wide
      >
        <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="col-span-full">
            <FormField label="Task title">
              <input
                required
                type="text"
                className={inputClass}
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Verify stock discrepancy at PM-033"
              />
            </FormField>
          </div>
          <div className="col-span-full">
            <FormField label="Description">
              <textarea
                required
                rows={3}
                className={inputClass}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </FormField>
          </div>
          <FormField label="Assign to">
            <select
              className={inputClass}
              value={form.assigneeId}
              onChange={(e) => setForm((f) => ({ ...f, assigneeId: e.target.value }))}
            >
              {EMPLOYEES.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} · {employee.role}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Related pump (optional)">
            <select
              className={inputClass}
              value={form.pumpId}
              onChange={(e) => setForm((f) => ({ ...f, pumpId: e.target.value }))}
            >
              <option value="">None</option>
              {PUMPS.map((pump) => (
                <option key={pump.id} value={pump.id}>
                  {pump.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Priority">
            <select
              className={inputClass}
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </FormField>
          <FormField label="Due">
            <input
              type="text"
              className={inputClass}
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              placeholder="Today, 05:00 PM"
            />
          </FormField>
          <div className="col-span-full flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              Create task
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
