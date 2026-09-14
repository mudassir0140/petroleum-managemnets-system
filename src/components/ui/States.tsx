import type { CSSProperties, ReactNode } from "react";
import { Button } from "@/components/ui/Button";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-subtle bg-surface-2/50 px-6 py-12 text-center">
      {icon && <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-surface-3 text-ink-muted">{icon}</div>}
      <p className="text-sm font-medium text-ink-primary">{title}</p>
      {description && <p className="max-w-sm text-xs text-ink-muted">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this data. Please try again.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border-subtle bg-surface-2/50 px-6 py-12 text-center">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full"
        style={{ background: "color-mix(in srgb, var(--status-critical) 12%, transparent)", color: "var(--status-critical)" }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16h.01" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-sm font-medium text-ink-primary">{title}</p>
      <p className="max-w-sm text-xs text-ink-muted">{description}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function Skeleton({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <div className={`animate-pulse rounded-md bg-surface-3 ${className}`} style={style} />;
}

export function KpiSkeleton() {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-1 p-5">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-3 h-7 w-28" />
      <Skeleton className="mt-4 h-3 w-16" />
    </div>
  );
}

export function CardSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-1 p-5">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-2 h-3 w-48" />
      <Skeleton className="mt-4 w-full" style={{ height }} />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}
