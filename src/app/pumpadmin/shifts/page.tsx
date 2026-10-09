"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { BackButton } from "@/components/dashboard/BackButton";
import { EmptyState } from "@/components/ui/States";
import { IconPlay, IconStop, IconCheck, IconClock } from "@/components/icons";
import { formatDateTime } from "@/lib/format";

interface Shift {
  _id: string;
  attendantName: string;
  attendantEmail: string;
  status: "in-progress" | "submitted" | "approved" | "rejected";
  startShift?: { timestamp: string; meterReading: number };
  endShift?: { timestamp: string; meterReading: number };
  litresSold?: number;
  amountDue?: number;
  date: string;
}

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShifts();
  }, []);

  async function fetchShifts() {
    try {
      const response = await fetch("/api/pumpadmin/shifts?days=30");
      if (response.ok) {
        const data = await response.json();
        setShifts(data);
      }
    } catch (error) {
      console.error("Failed to fetch shifts:", error);
    } finally {
      setLoading(false);
    }
  }

  const statusColors = {
    "in-progress": "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200",
    submitted: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-200",
    approved: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-200",
    rejected: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200",
  };

  return (
    <div>
      <BackButton />
      <PageHeader title="Shift Management" description="Track attendant shifts and meter readings" />

      {loading ? (
        <div className="text-center text-sm text-ink-muted">Loading shifts...</div>
      ) : shifts.length === 0 ? (
        <EmptyState title="No shifts yet" description="Shifts will appear here as attendants log in and start their shifts" />
      ) : (
        <div className="space-y-4">
          {shifts.map((shift) => (
            <Card key={shift._id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink-primary">{shift.attendantName}</p>
                  <p className="text-xs text-ink-muted">{shift.attendantEmail}</p>
                  <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-ink-muted">Start Reading</p>
                      {shift.startShift ? (
                        <p className="text-sm font-semibold text-ink-primary">
                          {shift.startShift.meterReading} L
                        </p>
                      ) : (
                        <p className="text-xs text-ink-muted">Pending</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-ink-muted">End Reading</p>
                      {shift.endShift ? (
                        <p className="text-sm font-semibold text-ink-primary">
                          {shift.endShift.meterReading} L
                        </p>
                      ) : (
                        <p className="text-xs text-ink-muted">Pending</p>
                      )}
                    </div>
                    {shift.litresSold !== undefined && (
                      <div>
                        <p className="text-xs text-ink-muted">Litres Sold</p>
                        <p className="text-sm font-semibold text-ink-primary">{shift.litresSold} L</p>
                      </div>
                    )}
                    {shift.amountDue !== undefined && (
                      <div>
                        <p className="text-xs text-ink-muted">Amount Due</p>
                        <p className="text-sm font-semibold text-ink-primary">Rs {shift.amountDue.toFixed(0)}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                      statusColors[shift.status as keyof typeof statusColors]
                    }`}
                  >
                    {shift.status === "in-progress" && <IconClock className="inline mr-1" size={12} />}
                    {shift.status === "submitted" && <IconPlay className="inline mr-1" size={12} />}
                    {shift.status === "approved" && <IconCheck className="inline mr-1" size={12} />}
                    {shift.status}
                  </span>
                  <p className="text-xs text-ink-muted">
                    {formatDateTime(shift.date)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
