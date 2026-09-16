"use server";

import { readJSON, writeJSON } from "./file-storage";

export interface Employee {
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

const FILENAME = "employees.json";

export async function createEmployee(employee: Omit<Employee, "_id">): Promise<Employee> {
  const employees = await getAllEmployees();
  const now = new Date().toISOString();

  const newEmployee: Employee = {
    ...employee,
    createdAt: typeof employee.createdAt === "string" ? employee.createdAt : now,
    updatedAt: typeof employee.updatedAt === "string" ? employee.updatedAt : now,
  };

  employees.push(newEmployee);
  await writeJSON(FILENAME, employees);
  return newEmployee;
}

export async function getEmployeeByEmail(email: string, role?: string): Promise<Employee | null> {
  const employees = await getAllEmployees();
  return employees.find((e) => e.email.toLowerCase() === email.toLowerCase() && (!role || e.role === role)) || null;
}

export async function getEmployeeById(employeeId: string): Promise<Employee | null> {
  const employees = await getAllEmployees();
  return employees.find((e) => e.employeeId === employeeId) || null;
}

export async function getEmployeesByRole(role: string): Promise<Employee[]> {
  const employees = await getAllEmployees();
  return employees.filter((e) => e.role === role);
}

export async function getAllEmployees(): Promise<Employee[]> {
  return readJSON<Employee>(FILENAME);
}

export async function updateEmployee(employeeId: string, updates: Partial<Employee>): Promise<Employee | null> {
  const employees = await getAllEmployees();
  const index = employees.findIndex((e) => e.employeeId === employeeId);

  if (index === -1) return null;

  const updated: Employee = {
    ...employees[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  employees[index] = updated;
  await writeJSON(FILENAME, employees);
  return updated;
}

export async function deleteEmployee(employeeId: string): Promise<boolean> {
  const employees = await getAllEmployees();
  const index = employees.findIndex((e) => e.employeeId === employeeId);

  if (index === -1) return false;

  employees.splice(index, 1);
  await writeJSON(FILENAME, employees);
  return true;
}

export async function generateEmployeeId(): Promise<string> {
  return `EMP-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}

export async function initializeEmployeeIndexes(): Promise<void> {
  console.log("[FileStorage] Employee file initialized");
}
