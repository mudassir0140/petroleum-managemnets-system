"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { IconUsers, IconFileText, IconClock, IconWallet, IconChevronRight } from "@/components/icons";

interface DashboardCard {
  title: string;
  titleUrdu: string;
  icon: React.ReactNode;
  href: string;
}

const NAVIGATION_CARDS: DashboardCard[] = [
  {
    title: "Staff Directory",
    titleUrdu: "عملے کی فہرست",
    icon: <IconUsers size={20} />,
    href: "/dashboard/employees/directory",
  },
  {
    title: "Attendance",
    titleUrdu: "حاضری",
    icon: <IconClock size={20} />,
    href: "/dashboard/employees/attendance",
  },
  {
    title: "Payroll",
    titleUrdu: "تنخواہیں",
    icon: <IconWallet size={20} />,
    href: "/dashboard/employees/payroll",
  },
  {
    title: "Shifts",
    titleUrdu: "شفٹیں",
    icon: <IconFileText size={20} />,
    href: "/dashboard/employees/shifts",
  },
];

export default function EmployeesDashboardPage() {
  return (
    <div>
      <PageHeader
        title="Employees & Attendance"
        description="Staff directory, pump assignment, shifts, weekly offs and payroll."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-8">
        {NAVIGATION_CARDS.map((card) => (
          <Link key={card.href} href={card.href} className="group flex flex-col justify-between rounded-2xl border border-border-subtle bg-surface-1 p-5 text-left transition-colors hover:border-brand-300 hover:bg-surface-2 lg:col-span-2">
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
