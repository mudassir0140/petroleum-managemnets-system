"use client";

import { SiteHeader } from "@/components/site-header";
import { Logo } from "@/components/brand/Logo";

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
                <Logo size="lg" />
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
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
