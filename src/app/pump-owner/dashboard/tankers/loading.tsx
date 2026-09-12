import { KpiSkeleton, TableSkeleton } from "@/components/ui/States";

export default function Loading() {
  return (
    <div>
      <div className="mb-6">
        <div className="h-7 w-48 animate-pulse rounded-md bg-surface-3" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded-md bg-surface-3" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
      <div className="mt-4 rounded-2xl border border-border-subtle bg-surface-1 p-5">
        <TableSkeleton rows={6} />
      </div>
    </div>
  );
}
