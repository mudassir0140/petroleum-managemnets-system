"use client";

import { BackButton } from "@/components/dashboard/BackButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";

export default function MyDetailsPage() {
  // Demo data - would be fetched from API with proper authentication
  const attendant = {
    name: "Ahmed Hassan",
    phone: "+92-300-1234567",
    username: "ahmed.hassan",
    pumpName: "Green Gas Station",
  };

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
          </div>
        </div>
      </Card>
    </div>
  );
}
