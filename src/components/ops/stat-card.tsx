import type { ComponentType } from "react";
import type { IconProps } from "@/components/icons";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "amber",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: ComponentType<IconProps>;
  tone?: "amber" | "sky" | "emerald" | "rose" | "purple";
}) {
  const toneClasses: Record<string, string> = {
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    sky: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {value}
          </p>
          {hint && (
            <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{hint}</p>
          )}
        </div>
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${toneClasses[tone]}`}
        >
          <Icon className="size-5" />
        </span>
      </div>
    </div>
  );
}
