// @ts-nocheck
import { EMPLOYEES } from "@/lib/dashboard/data/employees";

export type PayrollStatus = "Paid" | "Processing" | "Pending";

export type PayrollRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netPay: number;
  status: PayrollStatus;
  payPeriod: string;
  paidOn: string | null;
};

const OVERRIDES: Record<
  string,
  { bonus?: number; deductions?: number; status?: PayrollStatus; paidOn?: string | null }
> = {
  "EMP-01": { bonus: 5000, status: "Paid", paidOn: "2026-09-01" },
  "EMP-03": { bonus: 8000, status: "Paid", paidOn: "2026-09-01" },
  "EMP-05": { bonus: 3000, status: "Paid", paidOn: "2026-09-01" },
  "EMP-06": { status: "Paid", paidOn: "2026-09-01" },
  "EMP-07": { status: "Paid", paidOn: "2026-09-01" },
  "EMP-08": { deductions: 6000, status: "Processing" },
  "EMP-11": { bonus: 4000, status: "Paid", paidOn: "2026-09-01" },
  "EMP-14": { deductions: 15000, status: "Pending" },
  "EMP-15": { bonus: 10000, status: "Paid", paidOn: "2026-09-01" },
};

export const PAY_PERIOD = "September 2026";

export const PAYROLL_RECORDS: PayrollRecord[] = EMPLOYEES.map((employee) => {
  const override = OVERRIDES[employee.id] ?? {};
  const bonus = override.bonus ?? 0;
  const deductions = override.deductions ?? 0;
  return {
    id: `PR-${employee.id}`,
    employeeId: employee.id,
    employeeName: employee.name,
    department: employee.department,
    baseSalary: employee.salary,
    bonus,
    deductions,
    netPay: employee.salary + bonus - deductions,
    status: override.status ?? "Pending",
    payPeriod: PAY_PERIOD,
    paidOn: override.paidOn ?? null,
  };
});

export function totalNetPayroll(records: PayrollRecord[] = PAYROLL_RECORDS): number {
  return records.reduce((sum, r) => sum + r.netPay, 0);
}

export function totalByStatus(status: PayrollStatus, records: PayrollRecord[] = PAYROLL_RECORDS): number {
  return records.filter((r) => r.status === status).reduce((sum, r) => sum + r.netPay, 0);
}
