import { CardSkeleton, TableSkeleton } from "@/components/ui/States";

export default function Loading() {
  return (
    <div>
      <div className="mb-6">
        <div className="h-7 w-32 animate-pulse rounded-md bg-surface-3" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded-md bg-surface-3" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CardSkeleton height={140} />
        <CardSkeleton height={140} />
      </div>
      <div className="mt-4 rounded-2xl border border-border-subtle bg-surface-1 p-5">
        <TableSkeleton rows={8} />
      </div>
    </div>
  );
}
