"use client";

import { useState } from "react";
import { rejectPumpOwnerSignupRequest } from "@/lib/pump-owner/signup-actions";
import { XIcon } from "@/components/icons";

interface RejectPumpRequestButtonProps {
  requestId: string;
  adminId: string;
}

export default function RejectPumpRequestButton({
  requestId,
  adminId,
}: RejectPumpRequestButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showReason, setShowReason] = useState(false);
  const [reason, setReason] = useState("");

  async function handleReject() {
    setIsLoading(true);
    try {
      const rejectionReason = reason || undefined;
      const result = await rejectPumpOwnerSignupRequest(
        requestId,
        adminId,
        rejectionReason
      );

      if (result.success) {
        alert("Request rejected successfully");
        window.location.reload();
      } else {
        alert(result.error || "Failed to reject request");
      }
    } catch (error) {
      alert("An error occurred while rejecting the request");
    } finally {
      setIsLoading(false);
    }
  }

  if (showReason) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70">
        <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-slate-900 w-96">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Reject Pump Owner Request
          </h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Provide a reason for rejection (optional):
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Duplicate request, Invalid information, etc."
            className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            rows={3}
          />
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleReject}
              disabled={isLoading}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? "Rejecting..." : "Reject"}
            </button>
            <button
              onClick={() => {
                setShowReason(false);
                setReason("");
              }}
              disabled={isLoading}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50"
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
      className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
      title="Reject request"
    >
      <XIcon className="size-3.5" />
      Reject
    </button>
  );
}
