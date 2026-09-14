"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircleIcon, MessageIcon, PhoneIcon } from "@/components/icons";
import {
  ComplaintStatusBadge,
  PaymentStatusBadge,
  PriorityBadge,
} from "@/components/ops/badge";
import { FormField, inputClass, Modal } from "@/components/ops/modal";
import { PageHeader } from "@/components/ops/page-header";
import { SectionCard } from "@/components/ops/section-card";
import { StatCard } from "@/components/ops/stat-card";
import { AlertTriangleIcon, ClipboardIcon, WalletIcon } from "@/components/icons";
import { pumpById } from "@/lib/data/pumps";
import { formatCurrency } from "@/lib/format";
import { useComplaints, usePaymentFollowUps } from "@/lib/store/use-coordination";
import { useTankerTrips } from "@/lib/store/use-tanker-trips";
import type { Complaint } from "@/lib/manager/types";

export default function CoordinationPage() {
  const { complaints, updateComplaintStatus } = useComplaints();
  const { followUps, updateFollowUp } = usePaymentFollowUps();
  const { trips } = useTankerTrips();
  const [resolving, setResolving] = useState<Complaint | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");

  const overdueTotal = followUps
    .filter((f) => f.status === "overdue")
    .reduce((sum, f) => sum + f.amountDue, 0);
  const openComplaints = complaints.filter((c) => c.status !== "resolved").length;
  const confirmedDeliveries = trips.filter((t) => t.deliveryConfirmed);

  function openResolve(complaint: Complaint) {
    setResolving(complaint);
    setResolutionNotes(complaint.resolutionNotes ?? "");
  }

  function handleResolve(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resolving) return;
    updateComplaintStatus(resolving.id, "resolved", resolutionNotes);
    setResolving(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pump Owner Coordination"
        description="Payment follow-ups, delivery confirmations and complaint resolution with pump owners."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Overdue payments"
          value={formatCurrency(overdueTotal)}
          icon={WalletIcon}
          tone="rose"
        />
        <StatCard
          label="Open complaints"
          value={String(openComplaints)}
          icon={AlertTriangleIcon}
          tone="amber"
        />
        <StatCard
          label="Deliveries confirmed today"
          value={String(confirmedDeliveries.length)}
          icon={ClipboardIcon}
          tone="emerald"
        />
      </div>

      <SectionCard
        title="Payment follow-ups"
        description="Track dues from pump owners and log contact attempts"
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Pump owner</th>
                <th className="px-5 py-3 font-medium text-right">Amount due</th>
                <th className="px-5 py-3 font-medium">Due date</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Last contact</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {followUps.map((item) => {
                const pump = pumpById(item.pumpId);
                return (
                  <tr key={item.id}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {pump?.ownerName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{pump?.name}</p>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-900 dark:text-white">
                      {item.amountDue > 0 ? formatCurrency(item.amountDue) : "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{item.dueDate}</td>
                    <td className="px-5 py-3">
                      <PaymentStatusBadge status={item.status} />
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {item.lastContact}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        {item.status !== "paid" && (
                          <>
                            <a
                              href={`tel:${pump?.ownerPhone.replace(/\s+/g, "")}`}
                              className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                              aria-label={`Call ${pump?.ownerName}`}
                            >
                              <PhoneIcon className="size-4" />
                            </a>
                            <button
                              type="button"
                              onClick={() => updateFollowUp(item.id, "paid")}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500"
                            >
                              Mark paid
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard
          title="Pump owner complaints"
          description="Track, resolve and follow up on issues raised by owners"
          noPadding
        >
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {complaints.map((complaint) => {
              const pump = pumpById(complaint.pumpId);
              return (
                <li key={complaint.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {complaint.subject}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {pump?.name} · {pump?.ownerName} · {complaint.raisedOn}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <ComplaintStatusBadge status={complaint.status} />
                      <PriorityBadge priority={complaint.priority} />
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {complaint.description}
                  </p>
                  {complaint.resolutionNotes && (
                    <p className="mt-2 rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                      <CheckCircleIcon className="mr-1 inline size-3.5" />
                      {complaint.resolutionNotes}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {complaint.status !== "resolved" && (
                      <>
                        {complaint.status === "open" && (
                          <button
                            type="button"
                            onClick={() => updateComplaintStatus(complaint.id, "in-progress")}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            Start working
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openResolve(complaint)}
                          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
                        >
                          Resolve
                        </button>
                      </>
                    )}
                    <Link
                      href="/manager/chat"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <MessageIcon className="size-3.5" />
                      Message owner
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </SectionCard>

        <SectionCard
          title="Recent delivery confirmations"
          description="Deliveries confirmed with pump owners"
          noPadding
        >
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {confirmedDeliveries.map((trip) => {
              const pump = pumpById(trip.destinationPumpId);
              return (
                <li key={trip.id} className="flex items-start gap-3 p-5">
                  <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {pump?.name} confirmed receipt of {trip.quantityLiters.toLocaleString("en-IN")}L {trip.product}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Arrived {trip.actualArrival} · Owner: {pump?.ownerName}
                    </p>
                  </div>
                </li>
              );
            })}
            {confirmedDeliveries.length === 0 && (
              <li className="p-5 text-sm text-slate-500 dark:text-slate-400">
                No deliveries confirmed yet today.
              </li>
            )}
          </ul>

          <div className="border-t border-slate-100 p-5 dark:border-slate-800">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Quick contact
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Use the phone icon next to any pump owner above to call directly, or head to{" "}
              <Link href="/manager/chat" className="font-medium text-amber-600 hover:text-amber-500 dark:text-amber-400">
                Connect &amp; Chat
              </Link>{" "}
              for instant messaging.
            </p>
          </div>
        </SectionCard>
      </div>

      <Modal
        open={resolving !== null}
        onClose={() => setResolving(null)}
        title="Resolve complaint"
        description={resolving?.subject}
      >
        <form onSubmit={handleResolve} className="space-y-4">
          <FormField label="Resolution notes">
            <textarea
              required
              rows={4}
              className={inputClass}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Describe how this was resolved..."
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setResolving(null)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              Mark resolved
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
