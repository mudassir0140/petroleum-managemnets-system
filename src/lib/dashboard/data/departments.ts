// @ts-nocheck
import { EMPLOYEES } from "@/lib/dashboard/data/employees";

export type Department = {
  id: string;
  name: string;
  head: string;
  description: string;
  monthlyBudget: number;
};

export const DEPARTMENTS: Department[] = [];

export function departmentEmployeeCount(departmentName: string): number {
  return EMPLOYEES.filter((e) => e.department === departmentName).length;
}

export function departmentMonthlySalaries(departmentName: string): number {
  return EMPLOYEES.filter((e) => e.department === departmentName).reduce(
    (sum, e) => sum + e.salary,
    0,
  );
}
