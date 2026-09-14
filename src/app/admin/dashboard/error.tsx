"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/States";

export default function AdminDashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <ErrorState title="This page couldn't load" description="Something went wrong while fetching network data. Try again." onRetry={reset} />
    </div>
  );
}
