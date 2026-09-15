"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function FinanceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-border-subtle bg-surface-1 p-8">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-ink-primary">Something went wrong</h2>
        <p className="mt-2 text-sm text-ink-muted">Failed to load finance data. Please try again.</p>
        <Button onClick={reset} className="mt-4">
          Try again
        </Button>
      </div>
    </div>
  );
}
