export type EmployeeStatus = "Active" | "On Leave" | "Suspended";
export type AttendanceMark = "P" | "A" | "L";

export type Employee = {
  id: string;
  name: string;
  title: string;
  department: string;
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

export const EMPLOYEES: Employee[] = [
  { id: "EMP-01", name: "Ahmed Rehman", title: "Pump Manager", department: "Operations", assignedPump: "Pump 1", shift: "Morning", weeklyOff: "Sunday", phone: "+92 300 111 2233", status: "Active", salary: 85000, attendanceRate: 98, joinDate: "2022-03-14", week: ["P", "P", "P", "P", "P", "P", "A"] },
  { id: "EMP-02", name: "Saima Yousaf", title: "Cashier", department: "Operations", assignedPump: "Pump 1", shift: "Morning", weeklyOff: "Sunday", phone: "+92 301 004 5521", status: "Active", salary: 42000, attendanceRate: 95, joinDate: "2023-01-09", week: ["P", "P", "L", "P", "P", "P", "P"] },
  { id: "EMP-03", name: "Imran Chaudhry", title: "Pump Manager", department: "Operations", assignedPump: "Pump 2", shift: "Morning", weeklyOff: "Friday", phone: "+92 300 552 1190", status: "Active", salary: 88000, attendanceRate: 100, joinDate: "2021-11-02", week: ["P", "P", "P", "P", "P", "P", "P"] },
  { id: "EMP-04", name: "Zeeshan Aziz", title: "Pump Attendant", department: "Operations", assignedPump: "Pump 2", shift: "Afternoon", weeklyOff: "Friday", phone: "+92 302 990 2214", status: "Active", salary: 38000, attendanceRate: 91, joinDate: "2023-06-19", week: ["P", "A", "P", "P", "P", "P", "P"] },
  { id: "EMP-05", name: "Sana Malik", title: "Pump Manager", department: "Operations", assignedPump: "Pump 3", shift: "Morning", weeklyOff: "Sunday", phone: "+92 300 118 4432", status: "Active", salary: 90000, attendanceRate: 96, joinDate: "2020-08-25", week: ["P", "P", "P", "L", "P", "P", "P"] },
  { id: "EMP-06", name: "Usman Ghani", title: "Security Guard", department: "Security", assignedPump: "Pump 3", shift: "Night", weeklyOff: "Wednesday", phone: "+92 301 224 9987", status: "Active", salary: 32000, attendanceRate: 100, joinDate: "2022-02-11", week: ["P", "P", "P", "P", "P", "P", "P"] },
  { id: "EMP-07", name: "Waqar Hussain", title: "Pump Manager", department: "Operations", assignedPump: "Pump 4", shift: "Morning", weeklyOff: "Sunday", phone: "+92 300 990 6631", status: "Active", salary: 84000, attendanceRate: 97, joinDate: "2021-05-30", week: ["P", "P", "P", "P", "A", "P", "P"] },
  { id: "EMP-08", name: "Kamran Sheikh", title: "Pump Attendant", department: "Operations", assignedPump: "Pump 4", shift: "Afternoon", weeklyOff: "Sunday", phone: "+92 303 441 7723", status: "On Leave", salary: 37000, attendanceRate: 74, joinDate: "2023-09-04", week: ["A", "A", "A", "P", "P", "P", "P"] },
  { id: "EMP-09", name: "Malik Fuels", title: "Pump Manager", department: "Operations", assignedPump: "Pump 5", shift: "Morning", weeklyOff: "Friday", phone: "+92 300 224 8871", status: "Active", salary: 86000, attendanceRate: 93, joinDate: "2022-07-17", week: ["P", "P", "P", "P", "L", "P", "P"] },
  { id: "EMP-10", name: "Farah Deeba", title: "Cashier", department: "Operations", assignedPump: "Pump 5", shift: "Morning", weeklyOff: "Friday", phone: "+92 302 337 6612", status: "Active", salary: 41000, attendanceRate: 99, joinDate: "2023-02-21", week: ["P", "P", "P", "P", "P", "P", "A"] },
  { id: "EMP-11", name: "Bilal Ahmed", title: "Pump Manager", department: "Operations", assignedPump: "Pump 6", shift: "Morning", weeklyOff: "Sunday", phone: "+92 300 441 2205", status: "Active", salary: 82000, attendanceRate: 100, joinDate: "2020-12-01", week: ["P", "P", "P", "P", "P", "P", "P"] },
  { id: "EMP-12", name: "Rabia Naz", title: "Pump Attendant", department: "Operations", assignedPump: "Pump 6", shift: "Afternoon", weeklyOff: "Sunday", phone: "+92 304 662 3348", status: "Active", salary: 36000, attendanceRate: 90, joinDate: "2023-04-15", week: ["P", "P", "A", "P", "P", "P", "P"] },
  { id: "EMP-13", name: "Nasir Hussain", title: "Fleet Coordinator", department: "Logistics", assignedPump: "Central Depot", shift: "Morning", weeklyOff: "Sunday", phone: "+92 301 552 8890", status: "Active", salary: 78000, attendanceRate: 96, joinDate: "2021-10-08", week: ["P", "P", "P", "P", "P", "L", "P"] },
  { id: "EMP-14", name: "Javed Akhtar", title: "Mechanic", department: "Logistics", assignedPump: "Central Depot", shift: "Morning", weeklyOff: "Sunday", phone: "+92 308 224 1156", status: "Suspended", salary: 45000, attendanceRate: 58, joinDate: "2022-09-30", week: ["A", "A", "P", "A", "A", "A", "A"] },
  { id: "EMP-15", name: "Olamide Fashola", title: "Finance Officer", department: "Finance", assignedPump: "Head Office", shift: "Morning", weeklyOff: "Sunday", phone: "+92 300 774 2210", status: "Active", salary: 95000, attendanceRate: 99, joinDate: "2021-01-18", week: ["P", "P", "P", "P", "P", "P", "A"] },
];

export function totalMonthlyPayroll(): number {
  return EMPLOYEES.reduce((sum, e) => sum + e.salary, 0);
}
