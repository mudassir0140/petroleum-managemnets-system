// @ts-nocheck
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

export const LEAVE_TYPES: LeaveType[] = [];

export const LEAVE_REQUESTS: LeaveRequest[] = [];
