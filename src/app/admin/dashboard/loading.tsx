import { KpiSkeleton, CardSkeleton } from "@/components/ui/States";

export default function Loading() {
  return (
    <div>
      <div className="mb-6">
        <div className="h-7 w-48 animate-pulse rounded-md bg-surface-3" />
        <div className="mt-2 h-4 w-80 animate-pulse rounded-md bg-surface-3" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
      <div className="mt-4">
        <CardSkeleton height={280} />
      </div>
    </div>
  );
}
