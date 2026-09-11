import { EMPLOYEES } from "@/lib/dashboard/data/employees";

export type Department = {
  id: string;
  name: string;
  head: string;
  description: string;
  monthlyBudget: number;
};

export const DEPARTMENTS: Department[] = [
  {
    id: "DEPT-01",
    name: "Operations",
    head: "Ahmed Rehman",
    description: "Pump-floor staff — managers, attendants and cashiers across the network.",
    monthlyBudget: 1200000,
  },
  {
    id: "DEPT-02",
    name: "Security",
    head: "Usman Ghani",
    description: "On-site security guards stationed at every pump location.",
    monthlyBudget: 180000,
  },
  {
    id: "DEPT-03",
    name: "Logistics",
    head: "Nasir Hussain",
    description: "Fleet coordination, tanker maintenance and depot operations.",
    monthlyBudget: 260000,
  },
  {
    id: "DEPT-04",
    name: "Finance",
    head: "Olamide Fashola",
    description: "Company-wide accounting, invoicing and payroll processing.",
    monthlyBudget: 150000,
  },
];

export function departmentEmployeeCount(departmentName: string): number {
  return EMPLOYEES.filter((e) => e.department === departmentName).length;
}

export function departmentMonthlySalaries(departmentName: string): number {
  return EMPLOYEES.filter((e) => e.department === departmentName).reduce(
    (sum, e) => sum + e.salary,
    0,
  );
}
