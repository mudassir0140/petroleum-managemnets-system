"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { IconClock, IconDroplet, IconChevronDown, IconArrowLeft } from "@/components/icons";

interface DashboardCard {
  icon: React.ReactNode;
  title: string;
  titleUrdu: string;
  description: string;
  descriptionUrdu: string;
  href: string;
}

const DASHBOARD_CARDS: DashboardCard[] = [
  {
    icon: <IconChevronDown className="size-6 text-green-600" />,
    title: "Start Shift",
    titleUrdu: "شفٹ شروع کریں",
    description: "Record meter reading and photo",
    descriptionUrdu: "میٹر کی پڑھائی اور فوٹو درج کریں",
    href: "/attendant/dashboard/shift/start",
  },
  {
    icon: <IconArrowLeft className="size-6 text-red-600" />,
    title: "End Shift",
    titleUrdu: "شفٹ ختم کریں",
    description: "Submit end reading and close shift",
    descriptionUrdu: "آخری پڑھائی جمع کریں اور شفٹ بند کریں",
    href: "/attendant/dashboard/shift/end",
  },
  {
    icon: <IconDroplet className="size-6 text-blue-600" />,
    title: "Dispense & Sales",
    titleUrdu: "تقسیم اور فروخت",
    description: "Log fuel dispensed and cash collected",
    descriptionUrdu: "ایندھن اور رقم درج کریں",
    href: "/attendant/dashboard/dispense",
  },
  {
    icon: <IconClock className="size-6 text-purple-600" />,
    title: "Attendance & History",
    titleUrdu: "حاضری اور ریکارڈ",
    description: "View your shifts and reports",
    descriptionUrdu: "اپنی شفٹوں اور رپورٹیں دیکھیں",
    href: "/attendant/dashboard/history",
  },
];

export default function AttendantDashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Welcome to your attendant dashboard"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {DASHBOARD_CARDS.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="h-full transition hover:shadow-md hover:bg-surface-2">
              <div className="flex h-full flex-col p-6">
                <div className="mb-4">{card.icon}</div>
                <h3 className="text-sm font-semibold text-ink-primary">{card.title}</h3>
                <p className="text-xs text-ink-muted">{card.titleUrdu}</p>
                <p className="mt-3 text-xs text-ink-muted">{card.description}</p>
                <p className="text-xs text-ink-secondary">{card.descriptionUrdu}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
