"use server";

<<<<<<< HEAD
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
=======
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
>>>>>>> 2d242d75cdea8f65ba2668fa7f4b6a7ba774da3b
}

export async function generateEmployeeId(): Promise<string> {
  return generateEmployeeIdInStorage();
}

export async function initializeEmployeeIndexes(): Promise<void> {
<<<<<<< HEAD
  console.log("[FileStorage] Employee file initialized");
=======
  // No-op for localStorage
>>>>>>> 2d242d75cdea8f65ba2668fa7f4b6a7ba774da3b
}
