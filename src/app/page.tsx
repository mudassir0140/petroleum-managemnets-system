"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { DropletIcon } from "@/components/icons";
import { ROLES, setActiveRole } from "@/lib/roles";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 to-slate-900">
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

          <div className="relative mx-auto max-w-4xl px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
            <div className="text-center">
              <div className="flex justify-center mb-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10">
                  <DropletIcon className="h-8 w-8 text-amber-500" />
                </div>
              </div>

              <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
                Petrol & Diesel Management
              </h1>
              <p className="mt-2 text-3xl font-semibold text-amber-300 ltr:text-right rtl:text-left" dir="rtl">
                پیٹرول اور ڈیزل کا انتظام
              </p>

              <p className="mt-8 text-xl text-slate-300">
                Real-time fuel management system
              </p>
              <p className="mt-1 text-xl text-slate-300" dir="rtl">
                حقیقی وقت میں ایندھن کی منظم سہولت
              </p>

              <div className="mt-12">
                <Link
                  href={ROLES[0].dashboardHref}
                  onClick={() => setActiveRole(ROLES[0].slug)}
                  className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-8 py-4 text-lg font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400"
                >
                  Login / لاگ ان کریں
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
