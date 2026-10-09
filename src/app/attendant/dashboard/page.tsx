"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { IconClock, IconDroplet, IconUsers, IconFileText, IconWallet, IconHome } from "@/components/icons";

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
    icon: <IconHome className="size-6 text-blue-600" />,
    title: "My Details",
    titleUrdu: "میری تفصیلات",
    description: "Name, phone, username, pump",
    descriptionUrdu: "نام، فون، صارف نام، پمپ",
    href: "/attendant/dashboard/my-details",
  },
  {
    icon: <IconWallet className="size-6 text-green-600" />,
    title: "Daily Income",
    titleUrdu: "روزمرہ آمدنی",
    description: "Today's litres and amount sold",
    descriptionUrdu: "آج کی فروخت اور رقم",
    href: "/attendant/dashboard/daily-income",
  },
  {
    icon: <IconFileText className="size-6 text-purple-600" />,
    title: "Monthly Income",
    titleUrdu: "ماہانہ آمدنی",
    description: "This month's totals and breakdown",
    descriptionUrdu: "اس ماہ کی کل رقم اور تفصیل",
    href: "/attendant/dashboard/monthly-income",
  },
  {
    icon: <IconClock className="size-6 text-orange-600" />,
    title: "Shifts & Attendance",
    titleUrdu: "شفٹیں اور حاضری",
    description: "Your shift records and status",
    descriptionUrdu: "آپ کی شفٹوں کا ریکارڈ",
    href: "/attendant/dashboard/shifts",
  },
  {
    icon: <IconDroplet className="size-6 text-cyan-600" />,
    title: "Khata",
    titleUrdu: "کھاتہ",
    description: "Customer accounts you handle",
    descriptionUrdu: "گاہکوں کے کھاتے",
    href: "/attendant/dashboard/khata",
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
            <Card className="group h-full cursor-pointer transition hover:shadow-md hover:bg-surface-2">
              <div className="flex h-full flex-col justify-between p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                    {card.icon}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ink-primary">{card.title}</h3>
                  <p className="text-xs text-ink-muted">{card.titleUrdu}</p>
                  <p className="mt-3 text-xs text-ink-muted">{card.description}</p>
                  <p className="text-xs text-ink-secondary">{card.descriptionUrdu}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
