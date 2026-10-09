"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { IconUsers, IconFileText, IconClock, IconWallet } from "@/components/icons";

interface DashboardCard {
  title: string;
  titleUrdu: string;
  description: string;
  descriptionUrdu: string;
  icon: React.ReactNode;
  href: string;
}

const NAVIGATION_CARDS: DashboardCard[] = [
  {
    title: "Staff Directory",
    titleUrdu: "عملے کی فہرست",
    description: "View all employees and their details",
    descriptionUrdu: "تمام ملازمین کی معلومات دیکھیں",
    icon: <IconUsers size={20} />,
    href: "/dashboard/employees/directory",
  },
  {
    title: "Attendance",
    titleUrdu: "حاضری",
    description: "Daily attendance and records",
    descriptionUrdu: "روزمرہ حاضری کے ریکارڈ",
    icon: <IconClock size={20} />,
    href: "/dashboard/employees/attendance",
  },
  {
    title: "Payroll",
    titleUrdu: "تنخواہیں",
    description: "Salary and payment records",
    descriptionUrdu: "تنخواہ کی معلومات",
    icon: <IconWallet size={20} />,
    href: "/dashboard/employees/payroll",
  },
  {
    title: "Shifts",
    titleUrdu: "شفٹیں",
    description: "Shift schedules and management",
    descriptionUrdu: "شفٹ کے شیڈول",
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {NAVIGATION_CARDS.map((card) => (
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
