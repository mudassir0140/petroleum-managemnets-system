"use server";

import {
  createEmployee as createEmployeeInStorage,
  getEmployeeById as getEmployeeByIdInStorage,
  getEmployeeByEmail as getEmployeeByEmailInStorage,
  getAllEmployees as getAllEmployeesInStorage,
  updateEmployee as updateEmployeeInStorage,
  deleteEmployee as deleteEmployeeInStorage,
  generateEmployeeId as generateEmployeeIdInStorage,
} from "@/lib/storage/employees-storage";
import type { Employee } from "./models";

export async function createEmployee(employee: Omit<Employee, "_id">): Promise<Employee> {
  return createEmployeeInStorage(employee);
}

export async function getEmployeeByEmail(email: string, role?: string): Promise<Employee | null> {
  const employee = await getEmployeeByEmailInStorage(email);
  if (!employee) return null;
  if (role && employee.role !== role) return null;
  return employee;
}

export async function getEmployeeById(employeeId: string): Promise<Employee | null> {
  return getEmployeeByIdInStorage(employeeId);
}

export async function getEmployeesByRole(role: string): Promise<Employee[]> {
  const allEmployees = await getAllEmployeesInStorage();
  return allEmployees.filter((e) => e.role === role);
}

export async function getAllEmployees(): Promise<Employee[]> {
  return getAllEmployeesInStorage();
}

export async function updateEmployee(
  employeeId: string,
  updates: Partial<Employee>
): Promise<Employee | null> {
  return updateEmployeeInStorage(employeeId, updates);
}

export async function deleteEmployee(employeeId: string): Promise<boolean> {
  return deleteEmployeeInStorage(employeeId);
}

export async function generateEmployeeId(): Promise<string> {
  return generateEmployeeIdInStorage();
}

export async function initializeEmployeeIndexes(): Promise<void> {
  // No-op for localStorage
}
