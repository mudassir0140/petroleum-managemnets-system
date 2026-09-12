import { CardSkeleton } from "@/components/ui/States";

export default function Loading() {
  return (
    <div>
      <div className="mb-6">
        <div className="h-7 w-40 animate-pulse rounded-md bg-surface-3" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded-md bg-surface-3" />
      </div>
      <CardSkeleton height={150} />
      <div className="mt-4">
        <CardSkeleton />
      </div>
    </div>
  );
}
