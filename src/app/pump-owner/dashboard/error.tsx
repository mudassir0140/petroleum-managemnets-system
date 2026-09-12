"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/States";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <ErrorState
        title="This page couldn't load"
        description="Something went wrong while fetching your pump's data. Try again, and contact support if it keeps happening."
        onRetry={reset}
      />
    </div>
  );
}
