import { getStorageService } from "./localStorage-service";
import type { Employee } from "@/lib/db/models";

const COLLECTION = "employees";

export async function createEmployee(employee: Omit<Employee, "_id">): Promise<Employee> {
  const service = getStorageService();
  const now = new Date();
  const employeeData: any = {
    ...employee,
    id: employee.employeeId,
    _id: employee.employeeId,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  service.create(COLLECTION, employeeData);
  return employeeData;
}

export async function getEmployeeById(employeeId: string): Promise<Employee | null> {
  const service = getStorageService();
  const data = service.read(COLLECTION, employeeId);
  return data ? (data as any) : null;
}

export async function getEmployeeByEmail(email: string): Promise<Employee | null> {
  const service = getStorageService();
  const data = service.findOne(
    COLLECTION,
    (item: any) => item.email?.toLowerCase() === email.toLowerCase()
  );
  return data ? (data as any) : null;
}

export async function getAllEmployees(): Promise<Employee[]> {
  const service = getStorageService();
  return service.readAll(COLLECTION) as any[];
}

export async function updateEmployee(
  employeeId: string,
  updates: Partial<Employee>
): Promise<Employee | null> {
  const service = getStorageService();
  const updated = service.update(COLLECTION, employeeId, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
  return updated ? (updated as any) : null;
}

export async function deleteEmployee(employeeId: string): Promise<boolean> {
  const service = getStorageService();
  return service.delete(COLLECTION, employeeId);
}

export async function generateEmployeeId(): Promise<string> {
  return `EMP-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 9)
    .toUpperCase()}`;
}

export async function initializeEmployeeIndexes(): Promise<void> {
  // No-op for localStorage
}
