import type { Employee, LeaveRequest } from "@/lib/manager/types";

export const EMPLOYEES: Employee[] = [];

export const LEAVE_REQUESTS_SEED: LeaveRequest[] = [];

export function employeeById(id: string) {
  return EMPLOYEES.find((employee) => employee.id === id) ?? null;
}
