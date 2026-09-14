import type { Employee, LeaveRequest } from "@/lib/manager/types";

export const EMPLOYEES: Employee[] = [
  { id: "emp-01", name: "Anil Kumar", role: "Pump Supervisor", pumpId: "pmp-014", pumpName: "Ashoka Road Fuel Point", shift: "Morning", attendance: "present", phone: "+91 90210 10011", joinDate: "12 Jan 2022", avatarColor: "bg-amber-500" },
  { id: "emp-02", name: "Sunita Devi", role: "Pump Attendant", pumpId: "pmp-014", pumpName: "Ashoka Road Fuel Point", shift: "Morning", attendance: "present", phone: "+91 90210 10022", joinDate: "03 Mar 2023", avatarColor: "bg-orange-500" },
  { id: "emp-03", name: "Manoj Tiwari", role: "Pump Attendant", pumpId: "pmp-021", pumpName: "Highway 44 Service Station", shift: "Evening", attendance: "present", phone: "+91 90210 10033", joinDate: "22 Jul 2021", avatarColor: "bg-sky-500" },
  { id: "emp-04", name: "Rekha Singh", role: "Pump Supervisor", pumpId: "pmp-007", pumpName: "Central Market Pump", shift: "Morning", attendance: "present", phone: "+91 90210 10044", joinDate: "15 Sep 2020", avatarColor: "bg-emerald-500" },
  { id: "emp-05", name: "Vivek Pandey", role: "Cashier", pumpId: "pmp-007", pumpName: "Central Market Pump", shift: "Morning", attendance: "absent", phone: "+91 90210 10055", joinDate: "01 Feb 2023", avatarColor: "bg-purple-500" },
  { id: "emp-06", name: "Imran Khan", role: "Pump Attendant", pumpId: "pmp-019", pumpName: "North Bypass Pump", shift: "Morning", attendance: "present", phone: "+91 90210 10066", joinDate: "18 Nov 2022", avatarColor: "bg-rose-500" },
  { id: "emp-07", name: "Geeta Yadav", role: "Cashier", pumpId: "pmp-019", pumpName: "North Bypass Pump", shift: "Evening", attendance: "on-leave", phone: "+91 90210 10077", joinDate: "09 Apr 2024", avatarColor: "bg-cyan-500" },
  { id: "emp-08", name: "Rajesh Verma", role: "Pump Supervisor", pumpId: "pmp-026", pumpName: "Industrial Area Station", shift: "Morning", attendance: "present", phone: "+91 90210 10088", joinDate: "27 Jun 2021", avatarColor: "bg-indigo-500" },
  { id: "emp-09", name: "Pooja Mishra", role: "Pump Attendant", pumpId: "pmp-011", pumpName: "Airport Road Pump", shift: "Morning", attendance: "present", phone: "+91 90210 10099", joinDate: "14 Dec 2023", avatarColor: "bg-teal-500" },
  { id: "emp-10", name: "Ashok Rathore", role: "Cashier", pumpId: "pmp-011", pumpName: "Airport Road Pump", shift: "Night", attendance: "present", phone: "+91 90210 10100", joinDate: "05 May 2022", avatarColor: "bg-fuchsia-500" },
  { id: "emp-11", name: "Deepa Chauhan", role: "Pump Attendant", pumpId: "pmp-041", pumpName: "Old Town Fuel Point", shift: "Morning", attendance: "present", phone: "+91 90210 10111", joinDate: "30 Aug 2023", avatarColor: "bg-amber-500" },
  { id: "emp-12", name: "Sanjay Rawat", role: "Tanker Driver", pumpId: null, pumpName: null, shift: "Morning", attendance: "present", phone: "+91 90210 10122", joinDate: "11 Oct 2019", avatarColor: "bg-orange-500" },
  { id: "emp-13", name: "Harish Bhatt", role: "Tanker Driver", pumpId: null, pumpName: null, shift: "Morning", attendance: "present", phone: "+91 90210 10133", joinDate: "19 Feb 2020", avatarColor: "bg-sky-500" },
  { id: "emp-14", name: "Om Prakash", role: "Tanker Driver", pumpId: null, pumpName: null, shift: "Evening", attendance: "absent", phone: "+91 90210 10144", joinDate: "07 Jul 2021", avatarColor: "bg-emerald-500" },
  { id: "emp-15", name: "Naveen Joshi", role: "Field Officer", pumpId: null, pumpName: null, shift: "Morning", attendance: "present", phone: "+91 90210 10155", joinDate: "23 Jan 2022", avatarColor: "bg-purple-500" },
];

export const LEAVE_REQUESTS_SEED: LeaveRequest[] = [
  {
    id: "lv-01",
    employeeId: "emp-07",
    employeeName: "Geeta Yadav",
    fromDate: "10 Sep 2026",
    toDate: "12 Sep 2026",
    reason: "Family function",
    status: "pending",
    requestedOn: "07 Sep 2026",
  },
  {
    id: "lv-02",
    employeeId: "emp-05",
    employeeName: "Vivek Pandey",
    fromDate: "10 Sep 2026",
    toDate: "10 Sep 2026",
    reason: "Medical appointment",
    status: "pending",
    requestedOn: "09 Sep 2026",
  },
  {
    id: "lv-03",
    employeeId: "emp-14",
    employeeName: "Om Prakash",
    fromDate: "09 Sep 2026",
    toDate: "11 Sep 2026",
    reason: "Personal work",
    status: "approved",
    requestedOn: "05 Sep 2026",
  },
  {
    id: "lv-04",
    employeeId: "emp-03",
    employeeName: "Manoj Tiwari",
    fromDate: "02 Sep 2026",
    toDate: "03 Sep 2026",
    reason: "Fever",
    status: "rejected",
    requestedOn: "01 Sep 2026",
  },
];

export function employeeById(id: string) {
  return EMPLOYEES.find((employee) => employee.id === id) ?? null;
}
