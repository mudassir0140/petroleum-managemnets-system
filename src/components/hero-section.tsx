"use client";

import Link from "next/link";
import {
  ArrowRightIcon,
  BoltIcon,
  ClockIcon,
  GaugeIcon,
  ShieldCheckIcon,
} from "@/components/icons";
import { ROLES, setActiveRole } from "@/lib/roles";

const TANK_LEVELS = [
  { label: "Diesel", value: 82, color: "bg-amber-500" },
  { label: "Petrol (PMS)", value: 64, color: "bg-orange-500" },
  { label: "Kerosene", value: 45, color: "bg-sky-500" },
];

const TRUST_STATS = [
  { value: "500+", label: "Depots & stations" },
  { value: "99.9%", label: "Platform uptime" },
  { value: "24/7", label: "Live monitoring" },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-slate-950">
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:44px_44px]"
      />
      <div
        aria-hidden
        className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-amber-500/20 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute bottom-0 left-0 h-72 w-72 -translate-x-1/3 rounded-full bg-orange-600/10 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-7xl gap-14 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-10 lg:px-8 lg:py-28">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3.5 py-1.5 text-xs font-semibold text-amber-300">
            <BoltIcon className="size-3.5" />
            End-to-end petroleum operations platform
          </div>

          <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
            Manage every drop, from{" "}
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              depot to pump
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
            PetroManage unifies tank inventory, fuel distribution, station
            sales, and regulatory compliance in one real-time platform — so
            your team can cut losses, prevent stockouts, and keep every
            terminal running safely.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={ROLES[0].dashboardHref}
              onClick={() => setActiveRole(ROLES[0].slug)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400"
            >
              Get started
              <ArrowRightIcon className="size-4" />
            </Link>
            <Link
              href="#modules"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-6 py-3 text-sm font-semibold text-white transition hover:border-slate-500 hover:bg-slate-900"
            >
              Explore modules
            </Link>
          </div>

          <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-slate-800 pt-8">
            {TRUST_STATS.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd className="text-2xl font-bold text-white">{stat.value}</dd>
                <dd className="mt-1 text-xs text-slate-400">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/40 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">
                  Depot Overview
                </p>
                <p className="text-xs text-slate-400">Terminal 04 — Lagos</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                All systems operational
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {TANK_LEVELS.map((tank) => (
                <div key={tank.label}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300">
                      {tank.label}
                    </span>
                    <span className="text-slate-400">{tank.value}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full ${tank.color}`}
                      style={{ width: `${tank.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-slate-800 pt-5">
              <div className="flex flex-col items-center gap-1.5 text-center">
                <GaugeIcon className="size-4 text-amber-400" />
                <span className="text-[11px] text-slate-400">Live gauges</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-center">
                <ShieldCheckIcon className="size-4 text-amber-400" />
                <span className="text-[11px] text-slate-400">Compliant</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-center">
                <ClockIcon className="size-4 text-amber-400" />
                <span className="text-[11px] text-slate-400">Real-time</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
