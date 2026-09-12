import type { AttendanceStatus, TankerStatus } from "@/lib/types";

type Tone = "good" | "warning" | "serious" | "critical" | "neutral" | "brand";

export const TANKER_STATUS_LABEL: Record<TankerStatus, string> = {
  scheduled: "Scheduled",
  in_transit: "In transit",
  arriving_soon: "Arriving soon",
  arrived: "Arrived",
  delayed: "Delayed",
};

export const TANKER_STATUS_TONE: Record<TankerStatus, Tone> = {
  scheduled: "neutral",
  in_transit: "brand",
  arriving_soon: "warning",
  arrived: "good",
  delayed: "critical",
};

export const ATTENDANCE_STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  leave: "On leave",
  late: "Late",
};

export const ATTENDANCE_STATUS_TONE: Record<AttendanceStatus, Tone> = {
  present: "good",
  absent: "critical",
  leave: "neutral",
  late: "warning",
};
