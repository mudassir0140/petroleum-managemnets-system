"use client";

import { useState } from "react";
import { approvePumpOwnerSignupRequest } from "@/lib/pump-owner/signup-actions";
import { CheckCircleIcon } from "@/components/icons";

interface ApprovePumpRequestButtonProps {
  requestId: string;
  pumpId: string;
  adminId: string;
}

export default function ApprovePumpRequestButton({
  requestId,
  pumpId,
  adminId,
}: ApprovePumpRequestButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleApprove() {
    setIsLoading(true);
    try {
      const result = await approvePumpOwnerSignupRequest(requestId, adminId);
      if (result.success) {
        // Update pump account approval status
        const { getStoredPumps, savePump } = await import("@/lib/pump-owner/storage");
        const pumps = await getStoredPumps();
        const pump = pumps.find((p) => p.pumpId === pumpId);

        if (pump) {
          pump.approvalStatus = "approved";
          pump.approvedAt = new Date().toISOString();
          pump.approvedBy = adminId;
          await savePump(pump);
        }

        alert("Request approved successfully");
        window.location.reload();
      } else {
        alert(result.error || "Failed to approve request");
      }
    } catch (error) {
      alert("An error occurred while approving the request");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      onClick={handleApprove}
      disabled={isLoading}
      className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-green-700 disabled:opacity-50 dark:bg-green-600 dark:hover:bg-green-700"
      title="Approve request"
    >
      <CheckCircleIcon className="size-3.5" />
      {isLoading ? "Approving..." : "Approve"}
    </button>
  );
}
