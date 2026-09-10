const TONE_CLASSES: Record<string, string> = {
  success:
    "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30",
  warning:
    "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30",
  danger:
    "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/30",
  info:
    "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/30",
  neutral:
    "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-500/15 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600/40",
  purple:
    "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20 dark:bg-purple-500/10 dark:text-purple-400 dark:ring-purple-500/30",
};

export type BadgeTone = keyof typeof TONE_CLASSES;

export function Badge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

function Dot({ tone }: { tone: BadgeTone }) {
  const dotColor: Record<string, string> = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
    info: "bg-sky-500",
    neutral: "bg-slate-400",
    purple: "bg-purple-500",
  };
  return <span className={`size-1.5 rounded-full ${dotColor[tone]}`} />;
}

const PUMP_STATUS_TONE: Record<string, { tone: BadgeTone; label: string }> = {
  open: { tone: "success", label: "Open" },
  "low-stock": { tone: "warning", label: "Low Stock" },
  closed: { tone: "danger", label: "Closed" },
};

export function PumpStatusBadge({ status }: { status: string }) {
  const info = PUMP_STATUS_TONE[status] ?? { tone: "neutral", label: status };
  return (
    <Badge tone={info.tone}>
      <Dot tone={info.tone} />
      {info.label}
    </Badge>
  );
}

const TRIP_STATUS_TONE: Record<string, { tone: BadgeTone; label: string }> = {
  scheduled: { tone: "neutral", label: "Scheduled" },
  departed: { tone: "info", label: "Departed" },
  "in-transit": { tone: "info", label: "In Transit" },
  delayed: { tone: "danger", label: "Delayed" },
  arrived: { tone: "purple", label: "Arrived" },
  delivered: { tone: "success", label: "Delivered" },
};

export function TripStatusBadge({ status }: { status: string }) {
  const info = TRIP_STATUS_TONE[status] ?? { tone: "neutral", label: status };
  return (
    <Badge tone={info.tone}>
      <Dot tone={info.tone} />
      {info.label}
    </Badge>
  );
}

const TASK_STATUS_TONE: Record<string, { tone: BadgeTone; label: string }> = {
  todo: { tone: "neutral", label: "To Do" },
  "in-progress": { tone: "info", label: "In Progress" },
  verify: { tone: "purple", label: "Verify" },
  done: { tone: "success", label: "Done" },
};

export function TaskStatusBadge({ status }: { status: string }) {
  const info = TASK_STATUS_TONE[status] ?? { tone: "neutral", label: status };
  return <Badge tone={info.tone}>{info.label}</Badge>;
}

const PRIORITY_TONE: Record<string, BadgeTone> = {
  high: "danger",
  medium: "warning",
  low: "neutral",
};

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <Badge tone={PRIORITY_TONE[priority] ?? "neutral"}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)} priority
    </Badge>
  );
}

const PAYMENT_STATUS_TONE: Record<string, { tone: BadgeTone; label: string }> = {
  pending: { tone: "warning", label: "Pending" },
  overdue: { tone: "danger", label: "Overdue" },
  paid: { tone: "success", label: "Paid" },
};

export function PaymentStatusBadge({ status }: { status: string }) {
  const info = PAYMENT_STATUS_TONE[status] ?? { tone: "neutral", label: status };
  return <Badge tone={info.tone}>{info.label}</Badge>;
}

const COMPLAINT_STATUS_TONE: Record<string, { tone: BadgeTone; label: string }> = {
  open: { tone: "danger", label: "Open" },
  "in-progress": { tone: "warning", label: "In Progress" },
  resolved: { tone: "success", label: "Resolved" },
};

export function ComplaintStatusBadge({ status }: { status: string }) {
  const info = COMPLAINT_STATUS_TONE[status] ?? { tone: "neutral", label: status };
  return <Badge tone={info.tone}>{info.label}</Badge>;
}

const ATTENDANCE_TONE: Record<string, { tone: BadgeTone; label: string }> = {
  present: { tone: "success", label: "Present" },
  absent: { tone: "danger", label: "Absent" },
  "on-leave": { tone: "info", label: "On Leave" },
};

export function AttendanceBadge({ status }: { status: string }) {
  const info = ATTENDANCE_TONE[status] ?? { tone: "neutral", label: status };
  return (
    <Badge tone={info.tone}>
      <Dot tone={info.tone} />
      {info.label}
    </Badge>
  );
}

const LEAVE_STATUS_TONE: Record<string, { tone: BadgeTone; label: string }> = {
  pending: { tone: "warning", label: "Pending" },
  approved: { tone: "success", label: "Approved" },
  rejected: { tone: "danger", label: "Rejected" },
};

export function LeaveStatusBadge({ status }: { status: string }) {
  const info = LEAVE_STATUS_TONE[status] ?? { tone: "neutral", label: status };
  return <Badge tone={info.tone}>{info.label}</Badge>;
}

const ALERT_SEVERITY_TONE: Record<string, BadgeTone> = {
  critical: "danger",
  warning: "warning",
  info: "info",
};

export function AlertSeverityBadge({ severity }: { severity: string }) {
  return (
    <Badge tone={ALERT_SEVERITY_TONE[severity] ?? "neutral"}>
      <Dot tone={ALERT_SEVERITY_TONE[severity] ?? "neutral"} />
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </Badge>
  );
}
