export type LeaveType = "Annual" | "Sick" | "Casual" | "Unpaid";
export type LeaveStatus = "Pending" | "Approved" | "Rejected";

export type LeaveRequest = {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  type: LeaveType;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  appliedOn: string;
};

export const LEAVE_TYPES: LeaveType[] = ["Annual", "Sick", "Casual", "Unpaid"];

export const LEAVE_REQUESTS: LeaveRequest[] = [
  { id: "LV-2201", employeeId: "EMP-08", employeeName: "Kamran Sheikh", department: "Operations", type: "Sick", fromDate: "2026-09-08", toDate: "2026-09-10", days: 3, reason: "Fever and flu", status: "Approved", appliedOn: "2026-09-07" },
  { id: "LV-2202", employeeId: "EMP-04", employeeName: "Zeeshan Aziz", department: "Operations", type: "Casual", fromDate: "2026-09-14", toDate: "2026-09-14", days: 1, reason: "Family event", status: "Pending", appliedOn: "2026-09-11" },
  { id: "LV-2203", employeeId: "EMP-14", employeeName: "Javed Akhtar", department: "Logistics", type: "Unpaid", fromDate: "2026-09-01", toDate: "2026-09-06", days: 6, reason: "Personal emergency", status: "Approved", appliedOn: "2026-08-30" },
  { id: "LV-2204", employeeId: "EMP-02", employeeName: "Saima Yousaf", department: "Operations", type: "Annual", fromDate: "2026-09-20", toDate: "2026-09-24", days: 5, reason: "Family trip", status: "Pending", appliedOn: "2026-09-10" },
  { id: "LV-2205", employeeId: "EMP-09", employeeName: "Malik Fuels", department: "Operations", type: "Sick", fromDate: "2026-09-05", toDate: "2026-09-05", days: 1, reason: "Medical checkup", status: "Rejected", appliedOn: "2026-09-04" },
  { id: "LV-2206", employeeId: "EMP-13", employeeName: "Nasir Hussain", department: "Logistics", type: "Annual", fromDate: "2026-09-28", toDate: "2026-10-02", days: 5, reason: "Wedding in family", status: "Pending", appliedOn: "2026-09-09" },
];
