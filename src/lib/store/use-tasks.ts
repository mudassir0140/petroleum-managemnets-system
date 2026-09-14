"use client";

import { ALERTS_SEED, TASKS_SEED } from "@/lib/data/tasks";
import { useSharedState } from "@/lib/store/shared-store";
import type { ManagerTask, OperationalAlert, TaskStatus } from "@/lib/manager/types";

export function useTasks() {
  const [tasks, setTasks] = useSharedState<ManagerTask[]>("tasks", TASKS_SEED);

  function addTask(task: ManagerTask) {
    setTasks((prev) => [task, ...prev]);
  }

  function updateTaskStatus(id: string, status: TaskStatus) {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, status } : task)));
  }

  return { tasks, setTasks, addTask, updateTaskStatus };
}

export function useAlerts() {
  const [alerts, setAlerts] = useSharedState<OperationalAlert[]>("alerts", ALERTS_SEED);

  function dismissAlert(id: string) {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }

  return { alerts, setAlerts, dismissAlert };
}
