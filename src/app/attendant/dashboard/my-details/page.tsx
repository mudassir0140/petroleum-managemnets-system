"use client";

import { useEffect, useState } from "react";
import { BackButton } from "@/components/dashboard/BackButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { IconClock } from "@/components/icons";

interface Attendant {
  name: string;
  phone: string;
  username: string;
  pumpName: string;
  shiftHours?: number;
}

export default function MyDetailsPage() {
  const [attendant, setAttendant] = useState<Attendant>({
    name: "Ahmed Hassan",
    phone: "+92-300-1234567",
    username: "ahmed.hassan",
    pumpName: "Green Gas Station",
    shiftHours: 8,
  });

  useEffect(() => {
    // In a real app, this would fetch from the API with proper authentication
    // const fetchAttendantDetails = async () => {
    //   try {
    //     const response = await fetch("/api/attendant/profile");
    //     if (response.ok) {
    //       const data = await response.json();
    //       setAttendant(data);
    //     }
    //   } catch (error) {
    //     console.error("Failed to fetch attendant details:", error);
    //   }
    // };
    // fetchAttendantDetails();
  }, []);

  return (
    <div>
      <BackButton />
      <PageHeader title="My Details / میری تفصیلات" description="Your account information" />

      <Card>
        <CardHeader title="Personal Information / ذاتی معلومات" />
        <div className="space-y-6 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-medium text-ink-muted uppercase">Name / نام</label>
              <p className="mt-2 text-sm font-medium text-ink-primary">{attendant.name}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-ink-muted uppercase">Phone / فون</label>
              <p className="mt-2 text-sm font-medium text-ink-primary">{attendant.phone}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-ink-muted uppercase">Username / صارف نام</label>
              <p className="mt-2 text-sm font-medium text-ink-primary">{attendant.username}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-ink-muted uppercase">Pump / پمپ</label>
              <p className="mt-2 text-sm font-medium text-ink-primary">{attendant.pumpName}</p>
            </div>

            <div>
              <label className="flex items-center gap-1 text-xs font-medium text-ink-muted uppercase">
                <IconClock size={14} />
                Shift Duration / شفٹ کا دورانیہ
              </label>
              <p className="mt-2 text-sm font-medium text-ink-primary">{attendant.shiftHours} hours / {attendant.shiftHours} گھنٹے</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
