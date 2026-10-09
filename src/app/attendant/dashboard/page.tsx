"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { IconClock, IconDroplet, IconFileText, IconWallet, IconHome, IconChevronRight } from "@/components/icons";

interface DashboardCard {
  icon: React.ReactNode;
  title: string;
  titleUrdu: string;
  href: string;
}

const DASHBOARD_CARDS: DashboardCard[] = [
  {
    icon: <IconHome size={20} />,
    title: "My Details",
    titleUrdu: "میری تفصیلات",
    href: "/attendant/dashboard/my-details",
  },
  {
    icon: <IconWallet size={20} />,
    title: "Daily Income",
    titleUrdu: "روزمرہ آمدنی",
    href: "/attendant/dashboard/daily-income",
  },
  {
    icon: <IconFileText size={20} />,
    title: "Monthly Income",
    titleUrdu: "ماہانہ آمدنی",
    href: "/attendant/dashboard/monthly-income",
  },
  {
    icon: <IconClock size={20} />,
    title: "Shifts & Attendance",
    titleUrdu: "شفٹیں اور حاضری",
    href: "/attendant/dashboard/shifts",
  },
  {
    icon: <IconDroplet size={20} />,
    title: "Khata",
    titleUrdu: "کھاتہ",
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
          <Link key={card.href} href={card.href} className="group flex flex-col justify-between rounded-2xl border border-border-subtle bg-surface-1 p-5 text-left transition-colors hover:border-brand-300 hover:bg-surface-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                {card.icon}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink-primary">{card.title}</p>
              <p className="text-xs text-ink-muted">{card.titleUrdu}</p>
            </div>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-500">
              Open <IconChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
