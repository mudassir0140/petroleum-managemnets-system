"use client";

import { useState } from "react";
import { approveSignupRequest } from "@/lib/employee/actions";

export default function ApproveRequestButton({
  requestId,
  adminId,
}: {
  requestId: string;
  adminId: string;
}) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleApprove() {
    if (!confirm("Approve this signup request?")) return;

    setIsLoading(true);
    try {
      const result = await approveSignupRequest(requestId, adminId);
      if (result.success) {
        window.location.reload();
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      onClick={handleApprove}
      disabled={isLoading}
      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600"
    >
      {isLoading ? "..." : "Approve"}
    </button>
  );
}
