"use client";

import { useState } from "react";
import { rejectSignupRequest } from "@/lib/employee/actions";

export default function RejectRequestButton({
  requestId,
  adminId,
}: {
  requestId: string;
  adminId: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [showReason, setShowReason] = useState(false);
  const [reason, setReason] = useState("");

  async function handleReject() {
    setIsLoading(true);
    try {
      const result = await rejectSignupRequest(requestId, adminId, reason || undefined);
      if (result.success) {
        window.location.reload();
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (showReason) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="w-full max-w-sm rounded-lg bg-white p-6 dark:bg-slate-900">
          <h3 className="font-semibold text-slate-900 dark:text-white">Reject Request</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Enter a reason (optional):
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Invalid qualifications"
            className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            rows={3}
          />
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleReject}
              disabled={isLoading}
              className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-600"
            >
              {isLoading ? "..." : "Confirm Reject"}
            </button>
            <button
              onClick={() => setShowReason(false)}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowReason(true)}
      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
    >
      Reject
    </button>
  );
}
