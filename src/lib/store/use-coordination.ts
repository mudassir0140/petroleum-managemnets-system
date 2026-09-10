"use client";

import { COMPLAINTS_SEED, PAYMENT_FOLLOWUPS_SEED } from "@/lib/data/coordination";
import { useSharedState } from "@/lib/store/shared-store";
import type { Complaint, ComplaintStatus, PaymentFollowUp, PaymentStatus } from "@/lib/types";

export function useComplaints() {
  const [complaints, setComplaints] = useSharedState<Complaint[]>(
    "complaints",
    COMPLAINTS_SEED,
  );

  function addComplaint(complaint: Complaint) {
    setComplaints((prev) => [complaint, ...prev]);
  }

  function updateComplaintStatus(
    id: string,
    status: ComplaintStatus,
    resolutionNotes?: string,
  ) {
    setComplaints((prev) =>
      prev.map((complaint) =>
        complaint.id === id
          ? {
              ...complaint,
              status,
              resolutionNotes: resolutionNotes ?? complaint.resolutionNotes,
            }
          : complaint,
      ),
    );
  }

  return { complaints, setComplaints, addComplaint, updateComplaintStatus };
}

export function usePaymentFollowUps() {
  const [followUps, setFollowUps] = useSharedState<PaymentFollowUp[]>(
    "payment-followups",
    PAYMENT_FOLLOWUPS_SEED,
  );

  function updateFollowUp(id: string, status: PaymentStatus, notes?: string) {
    setFollowUps((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              notes: notes ?? item.notes,
              lastContact: "Today",
            }
          : item,
      ),
    );
  }

  return { followUps, setFollowUps, updateFollowUp };
}
