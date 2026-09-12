import { KpiSkeleton, CardSkeleton, TableSkeleton } from "@/components/ui/States";

export default function Loading() {
  return (
    <div>
      <div className="mb-6">
        <div className="h-7 w-56 animate-pulse rounded-md bg-surface-3" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded-md bg-surface-3" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CardSkeleton height={160} />
        </div>
        <CardSkeleton height={176} />
      </div>
      <div className="mt-4 rounded-2xl border border-border-subtle bg-surface-1 p-5">
        <TableSkeleton rows={6} />
      </div>
    </div>
  );
}
