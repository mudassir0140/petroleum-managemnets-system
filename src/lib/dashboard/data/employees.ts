// @ts-nocheck
export type EmployeeStatus = "Active" | "On Leave" | "Suspended";
export type AttendanceMark = "P" | "A" | "L";

export type Employee = {
  id: string;
  name: string;
  title: string;
  department: string;
  role?: string;
  email?: string;
  password?: string;
  assignedPump: string;
  shift: "Morning" | "Afternoon" | "Night";
  weeklyOff: string;
  phone: string;
  status: EmployeeStatus;
  salary: number;
  attendanceRate: number;
  joinDate: string;
  week: AttendanceMark[];
};

export const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export const EMPLOYEES: Employee[] = [];

export function totalMonthlyPayroll(): number {
  return EMPLOYEES.reduce((sum, e) => sum + e.salary, 0);
}
