import Link from "next/link";
import { ArrowRightIcon, CheckCircleIcon } from "@/components/icons";

const BARS = [62, 78, 54, 91, 70, 85, 96];
const HIGHLIGHTS = [
  "Demand forecasting by station and product grade",
  "Automated variance & pilferage alerts",
  "Exportable, audit-ready compliance reports",
];

export function InsightsSection() {
  return (
    <section id="insights" className="bg-white py-20 dark:bg-slate-950 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Insights
          </h2>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Decisions backed by real-time data
          </p>
          <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400">
            Turn every dip reading, delivery, and sale into a live picture of
            margin, throughput, and risk across your network of depots and
            stations.
          </p>

          <ul className="mt-6 space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                <CheckCircleIcon className="mt-0.5 size-5 shrink-0 text-amber-500" />
                {item}
              </li>
            ))}
          </ul>

          <Link
            href="#contact"
            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-amber-600 hover:text-amber-500 dark:text-amber-400"
          >
            Talk to our team
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Weekly throughput
            </p>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              +12.4% vs. last week
            </span>
          </div>

          <div className="mt-6 flex h-40 items-end gap-3">
            {BARS.map((height, index) => (
              <div key={index} className="flex h-full flex-1 items-end">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-amber-500 to-orange-400"
                  style={{ height: `${height}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between text-[11px] text-slate-400">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
