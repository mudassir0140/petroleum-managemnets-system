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
};

export type BadgeTone = keyof typeof TONE_CLASSES;

const EXACT_STATUS_TONE: Record<string, BadgeTone> = {
  active: "success",
  delivered: "success",
  paid: "success",
  healthy: "success",
  completed: "success",
  ready: "success",
  present: "success",
  approved: "success",
  resolved: "success",
  maintenance: "warning",
  low: "warning",
  pending: "warning",
  "on leave": "warning",
  processing: "warning",
  generating: "warning",
  late: "warning",
  scheduled: "warning",
  offline: "danger",
  critical: "danger",
  delayed: "danger",
  cancelled: "danger",
  overdue: "danger",
  failed: "danger",
  suspended: "danger",
  absent: "danger",
  rejected: "danger",
  closed: "danger",
  "in transit": "info",
  loading: "info",
  idle: "neutral",
};

const SUCCESS_WORDS = ["active", "open", "paid", "resolved", "present", "delivered", "approved", "confirmed", "available"];
const WARNING_WORDS = ["pending", "low stock", "in progress", "scheduled", "on leave", "review"];
const DANGER_WORDS = ["closed", "overdue", "rejected", "absent", "suspended", "delayed", "critical"];

function inferTone(text: string): BadgeTone {
  const lower = text.toLowerCase();
  if (EXACT_STATUS_TONE[lower]) return EXACT_STATUS_TONE[lower];
  if (SUCCESS_WORDS.some((w) => lower.includes(w))) return "success";
  if (WARNING_WORDS.some((w) => lower.includes(w))) return "warning";
  if (DANGER_WORDS.some((w) => lower.includes(w))) return "danger";
  return "neutral";
}

export function Badge({
  tone,
  children,
  className = "",
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}) {
  const resolvedTone = tone ?? (typeof children === "string" ? inferTone(children) : "neutral");
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${TONE_CLASSES[resolvedTone]} ${className}`}
    >
      {children}
    </span>
  );
}
