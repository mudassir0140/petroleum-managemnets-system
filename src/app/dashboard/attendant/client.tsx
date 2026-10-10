// @ts-nocheck
"use client";

import Link from "next/link";
import { UsersIcon, ClipboardIcon, ChevronRightIcon, DropletIcon } from "@/components/icons";

interface NavigationCard {
  title: string;
  titleUrdu: string;
  icon: React.ReactNode;
  href: string;
}

const NAVIGATION_CARDS: NavigationCard[] = [
  {
    title: "Khata",
    titleUrdu: "کھاتہ",
    icon: <DropletIcon size={20} />,
    href: "/dashboard/attendant/khata",
  },
  {
    title: "Employees",
    titleUrdu: "ملازمین",
    icon: <UsersIcon size={20} />,
    href: "/dashboard/attendant/employees",
  },
  {
    title: "Attendance",
    titleUrdu: "حاضری",
    icon: <ClipboardIcon size={20} />,
    href: "/dashboard/attendant/attendance",
  },
];

export function AttendantOverviewClient({ session }: { session: any }) {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Pump Attendant Dashboard
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          ٹینک اٹینڈنٹ ڈیش بورڈ
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {NAVIGATION_CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left transition-colors hover:border-amber-300 hover:bg-amber-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-500/50 dark:hover:bg-amber-500/10"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                {card.icon}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{card.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{card.titleUrdu}</p>
            </div>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
              Open <ChevronRightIcon size={14} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
