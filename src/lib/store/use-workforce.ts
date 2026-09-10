"use client";

import { EMPLOYEES, LEAVE_REQUESTS_SEED } from "@/lib/data/employees";
import { useSharedState } from "@/lib/store/shared-store";
import type {
  AttendanceStatus,
  Employee,
  LeaveRequest,
  LeaveStatus,
  ShiftName,
} from "@/lib/types";

export function useAttendance() {
  const initial: Record<string, AttendanceStatus> = Object.fromEntries(
    EMPLOYEES.map((employee) => [employee.id, employee.attendance]),
  );
  const [attendance, setAttendance] = useSharedState<Record<string, AttendanceStatus>>(
    "attendance",
    initial,
  );
  const [shifts, setShifts] = useSharedState<Record<string, ShiftName>>(
    "shift-assignments",
    Object.fromEntries(EMPLOYEES.map((employee) => [employee.id, employee.shift])),
  );

  function setStatus(employeeId: string, status: AttendanceStatus) {
    setAttendance((prev) => ({ ...prev, [employeeId]: status }));
  }

  function setShift(employeeId: string, shift: ShiftName) {
    setShifts((prev) => ({ ...prev, [employeeId]: shift }));
  }

  function employeesWithAttendance(): Employee[] {
    return EMPLOYEES.map((employee) => ({
      ...employee,
      attendance: attendance[employee.id] ?? employee.attendance,
      shift: shifts[employee.id] ?? employee.shift,
    }));
  }

  return { attendance, setStatus, shifts, setShift, employeesWithAttendance };
}

export function useLeaveRequests() {
  const [requests, setRequests] = useSharedState<LeaveRequest[]>(
    "leave-requests",
    LEAVE_REQUESTS_SEED,
  );

  function updateStatus(id: string, status: LeaveStatus) {
    setRequests((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  return { requests, setRequests, updateStatus };
}
